import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/cards.jpg"
      alt="Logo"
      width={400}
      height={400}
      className="rounded"
    />
  );
}
