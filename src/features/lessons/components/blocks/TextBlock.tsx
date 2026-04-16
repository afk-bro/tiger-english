type Props = { content: string };
export default function TextBlock({ content }: Props) {
  return <p className="text-base leading-relaxed text-semantic-text">{content}</p>;
}
