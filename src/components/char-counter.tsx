// Character counter for free-text fields. Shown below fields that have a max
// length, so the visitor can see how much room is left before the limit.
export function CharCounter({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  const isOver = remaining < 0;
  const isNear = !isOver && remaining <= Math.max(10, max * 0.1);

  return (
    <p
      className={`mt-1 text-right text-sm ${
        isOver ? "text-red-600" : isNear ? "text-amber-600" : "text-gray-600"
      }`}
    >
      {value.length}/{max}
    </p>
  );
}
