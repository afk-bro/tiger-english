type Props = { content: string };
export default function HeadingBlock({ content }: Props) {
  return <h2 className="text-xl font-semibold text-semantic-text mt-2">{content}</h2>;
}
