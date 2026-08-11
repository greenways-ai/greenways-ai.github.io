#!/usr/bin/env python3
"""Render a GLB logo as a consistently framed transparent PNG in Blender."""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

FRAME_PADDING = 1.25
MAX_EDGE_ALPHA = 1.0 / 255.0


def parse_arguments() -> argparse.Namespace:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Input .glb file")
    parser.add_argument("--output", required=True, type=Path, help="Output .png file")
    parser.add_argument("--size", type=int, default=1600, help="Square output size")
    parser.add_argument("--samples", type=int, default=64, help="Eevee render samples")
    parser.add_argument("--azimuth", type=float, default=35.0, help="Camera azimuth in degrees")
    parser.add_argument("--elevation", type=float, default=24.0, help="Camera elevation in degrees")
    options = parser.parse_args(arguments)

    if options.input.suffix.lower() != ".glb":
        parser.error("--input must be a .glb file")
    if options.output.suffix.lower() != ".png":
        parser.error("--output must be a .png file")
    if not 256 <= options.size <= 4096:
        parser.error("--size must be between 256 and 4096")
    if not 1 <= options.samples <= 1024:
        parser.error("--samples must be between 1 and 1024")
    return options


def mesh_objects(objects: list[bpy.types.Object]) -> list[bpy.types.Object]:
    return [
        item
        for item in objects
        if item.type in {"MESH", "CURVE", "SURFACE", "META", "FONT"}
        and not item.hide_render
        and hasattr(item, "bound_box")
    ]


def bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector, list[Vector]]:
    points = [
        item.matrix_world @ Vector(corner)
        for item in objects
        for corner in item.bound_box
    ]
    if not points:
        raise RuntimeError("The imported GLB has no renderable geometry")

    minimum = Vector(tuple(min(point[index] for point in points) for index in range(3)))
    maximum = Vector(tuple(max(point[index] for point in points) for index in range(3)))
    return minimum, maximum, points


def normalize_import(imported: list[bpy.types.Object]) -> list[bpy.types.Object]:
    retained: list[bpy.types.Object] = []
    for item in imported:
        if item.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(item, do_unlink=True)
        else:
            retained.append(item)

    imported = retained
    geometry = mesh_objects(imported)
    minimum, maximum, _ = bounds(geometry)
    center = (minimum + maximum) * 0.5
    extent = maximum - minimum
    longest_side = max(extent)
    if longest_side <= 0:
        raise RuntimeError("The imported GLB has zero-size geometry")

    roots = [item for item in imported if item.parent not in imported]
    transform = Matrix.Scale(2.0 / longest_side, 4) @ Matrix.Translation(-center)
    for item in roots:
        item.matrix_world = transform @ item.matrix_world

    bpy.context.view_layer.update()
    return mesh_objects(imported)


def look_at(item: bpy.types.Object, target: Vector) -> None:
    item.rotation_euler = (target - item.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
) -> None:
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    item = bpy.data.objects.new(name=name, object_data=data)
    bpy.context.scene.collection.objects.link(item)
    item.location = location
    look_at(item, Vector((0.0, 0.0, 0.0)))


def configure_camera(
    geometry: list[bpy.types.Object], azimuth: float, elevation: float
) -> None:
    scene = bpy.context.scene
    camera_data = bpy.data.cameras.new("LogoCamera")
    camera = bpy.data.objects.new("LogoCamera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    azimuth_radians = math.radians(azimuth)
    elevation_radians = math.radians(elevation)
    radius = 6.0
    camera.location = Vector(
        (
            radius * math.sin(azimuth_radians) * math.cos(elevation_radians),
            -radius * math.cos(azimuth_radians) * math.cos(elevation_radians),
            radius * math.sin(elevation_radians),
        )
    )
    look_at(camera, Vector((0.0, 0.0, 0.0)))
    camera_data.type = "ORTHO"
    camera_data.clip_start = 0.01
    camera_data.clip_end = 100.0

    # Blender defers matrix_world updates after changing rotation_euler. Reading the
    # camera matrix before this update frames the model in world X/Y instead of the
    # actual camera plane, which can clip tall or oblique logos.
    bpy.context.view_layer.update()

    _, _, points = bounds(geometry)
    inverse = camera.matrix_world.inverted()
    camera_points = [inverse @ point for point in points]
    minimum_x = min(point.x for point in camera_points)
    maximum_x = max(point.x for point in camera_points)
    minimum_y = min(point.y for point in camera_points)
    maximum_y = max(point.y for point in camera_points)

    projected_center = Vector(
        (
            (minimum_x + maximum_x) * 0.5,
            (minimum_y + maximum_y) * 0.5,
            0.0,
        )
    )
    camera.location += camera.matrix_world.to_3x3() @ projected_center
    bpy.context.view_layer.update()

    projected_width = maximum_x - minimum_x
    projected_height = maximum_y - minimum_y
    camera_data.ortho_scale = max(projected_width, projected_height) * FRAME_PADDING


def configure_world_and_lighting() -> None:
    scene = bpy.context.scene
    world = bpy.data.worlds.new("LogoWorld") if not scene.world else scene.world
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.055, 0.065, 0.06, 1.0)
        background.inputs["Strength"].default_value = 0.45

    add_area_light("Key", (4.2, -5.0, 5.2), 950.0, 5.0, (1.0, 0.91, 0.78))
    add_area_light("Fill", (-4.4, -1.8, 2.8), 520.0, 4.5, (0.72, 0.88, 1.0))
    add_area_light("Rim", (1.4, 4.8, 4.3), 760.0, 3.8, (1.0, 0.98, 0.88))


def set_enum_with_fallback(owner: object, attribute: str, values: tuple[str, ...]) -> None:
    for value in values:
        try:
            setattr(owner, attribute, value)
            return
        except (TypeError, ValueError):
            continue


def configure_render(options: argparse.Namespace) -> None:
    scene = bpy.context.scene
    set_enum_with_fallback(scene.render, "engine", ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"))

    eevee = getattr(scene, "eevee", None)
    if eevee is not None:
        if hasattr(eevee, "taa_render_samples"):
            eevee.taa_render_samples = options.samples
        if hasattr(eevee, "use_gtao"):
            eevee.use_gtao = True
        if hasattr(eevee, "gtao_distance"):
            eevee.gtao_distance = 3.0
        if hasattr(eevee, "gtao_factor"):
            eevee.gtao_factor = 1.25
        if hasattr(eevee, "use_soft_shadows"):
            eevee.use_soft_shadows = True

    scene.render.resolution_x = options.size
    scene.render.resolution_y = options.size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    if hasattr(scene.render, "film_transparent_glass"):
        scene.render.film_transparent_glass = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
    scene.render.filepath = str(options.output)

    set_enum_with_fallback(scene.view_settings, "view_transform", ("AgX", "Filmic", "Standard"))
    set_enum_with_fallback(
        scene.view_settings,
        "look",
        ("AgX - Medium High Contrast", "Medium High Contrast", "Medium High Contrast Look", "None"),
    )
    scene.view_settings.exposure = 0.0


def validate_transparent_border(output: Path) -> None:
    image = bpy.data.images.load(str(output), check_existing=False)
    try:
        width, height = image.size
        pixels = image.pixels
        edge_alpha = 0.0
        for x in range(width):
            edge_alpha = max(
                edge_alpha,
                pixels[(x * 4) + 3],
                pixels[(((height - 1) * width + x) * 4) + 3],
            )
        for y in range(height):
            edge_alpha = max(
                edge_alpha,
                pixels[((y * width) * 4) + 3],
                pixels[((y * width + width - 1) * 4) + 3],
            )
        if edge_alpha > MAX_EDGE_ALPHA:
            raise RuntimeError(
                f"Rendered logo touches the image boundary (maximum edge alpha {edge_alpha:.4f})"
            )
    finally:
        bpy.data.images.remove(image)


def main() -> None:
    options = parse_arguments()
    options.input = options.input.resolve()
    options.output = options.output.resolve()
    if not options.input.is_file():
        raise FileNotFoundError(options.input)
    options.output.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    before = set(bpy.data.objects)
    result = bpy.ops.import_scene.gltf(filepath=str(options.input))
    if "FINISHED" not in result:
        raise RuntimeError(f"Blender could not import {options.input}")

    imported = [item for item in bpy.data.objects if item not in before]
    geometry = normalize_import(imported)
    configure_camera(geometry, options.azimuth, options.elevation)
    configure_world_and_lighting()
    configure_render(options)
    bpy.ops.render.render(write_still=True)
    validate_transparent_border(options.output)
    print(f"Rendered {options.input.name} -> {options.output}")


if __name__ == "__main__":
    main()
