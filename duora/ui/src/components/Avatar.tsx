type Props = {
  src: string;
  alt?: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  ringWidth?: number;
};

export function Avatar({ src, alt = '', size = 44, ring = false, online = false, ringWidth = 2.5 }: Props) {
  if (ring) {
    return (
      <span
        className="avatar avatar__ring"
        style={{ width: size, height: size, padding: ringWidth }}
      >
        <span className="avatar__inner">
          <img src={src} alt={alt} loading="lazy" />
        </span>
        {online && <span className="presence" />}
      </span>
    );
  }
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <img src={src} alt={alt} loading="lazy" />
      {online && <span className="presence" />}
    </span>
  );
}
