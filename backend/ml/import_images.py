"""Scan decor_dataset/data/images subfolders and insert images into decor_images table."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "images")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


async def import_images():
    from database import AsyncSessionLocal
    from models import DecorImage
    from sqlalchemy import select

    if not os.path.isdir(IMAGES_DIR):
        return

    async with AsyncSessionLocal() as db:
        inserted = 0
        for subfolder in os.listdir(IMAGES_DIR):
            subfolder_path = os.path.join(IMAGES_DIR, subfolder)
            if not os.path.isdir(subfolder_path):
                continue
            function_type = subfolder
            for fname in os.listdir(subfolder_path):
                ext = os.path.splitext(fname)[1].lower()
                if ext not in IMAGE_EXTENSIONS:
                    continue
                # Use subfolder/filename as unique filename to avoid collisions
                unique_filename = f"{subfolder}/{fname}"
                result = await db.execute(
                    select(DecorImage).where(DecorImage.filename == unique_filename)
                )
                if result.scalar_one_or_none() is not None:
                    continue
                img = DecorImage(
                    filename=unique_filename,
                    function_type=function_type,
                    is_labelled=False,
                )
                db.add(img)
                inserted += 1

        await db.commit()
        if inserted:
            import logging
            logging.info(f"import_images: inserted {inserted} new decor images")
