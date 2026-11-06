import { ImageResponse } from "next/og";

// iPhone home-screen icon (Add to Home Screen) — same heart as icon.svg
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6E2748 0%, #1C0F22 100%)",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path
            d="M32 52.5 29.2 50C18.6 40.5 11.5 34.1 11.5 26.3 11.5 19.9 16.5 15 22.8 15c3.6 0 7 1.7 9.2 4.3C34.2 16.7 37.6 15 41.2 15c6.3 0 11.3 4.9 11.3 11.3 0 7.8-7.1 14.2-17.7 23.7Z"
            fill="#E8566F"
          />
        </svg>
      </div>
    ),
    size,
  );
}
