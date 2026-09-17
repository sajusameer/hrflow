import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#059669", // emerald-600 (HRFlow ব্র্যান্ড কালার)
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 700,
          borderRadius: "8px",
        }}
      >
        H
      </div>
    ),
    {
      ...size,
    }
  );
}