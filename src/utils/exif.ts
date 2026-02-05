import ExifReader from "exifreader";

export interface ExifData {
  camera?: string;
  iso?: string;
  shutter?: string;
  aperture?: string;
  focalLength?: string;
  lensModel?: string;
  width?: number;
  height?: number;
  megapixels?: string | null;
  size?: number;
}

export const extractExif = (buffer: ArrayBuffer, size?: number): ExifData => {
  try {
    const tags = ExifReader.load(buffer);
    const make = tags.Make?.description || "";
    const model = tags.Model?.description || "";
    const camera = make && model ? `${make} ${model}` : make || model;
    const width = tags["Image Width"]?.value as number | undefined;
    const height = tags["Image Height"]?.value as number | undefined;
    const megapixels =
      width && height ? ((width * height) / 1_000_000).toFixed(1) : null;
    return {
      camera,
      iso: tags.ISOSpeedRatings?.description,
      shutter: tags.ExposureTime?.description,
      aperture: tags.FNumber?.description,
      focalLength: tags.FocalLength35efl?.description || tags.FocalLength?.description,
      lensModel: tags.LensModel?.description,
      width,
      height,
      megapixels,
      size,
    };
  } catch (err) {
    return {};
  }
};

export const fetchExifFromUrl = async (url: string): Promise<ExifData> => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return extractExif(buffer, buffer.byteLength);
  } catch (err) {
    return {};
  }
};
