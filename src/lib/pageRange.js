function parsePageRange(쪽수) {
  const match = /^(\d+)~(\d+)$/.exec(쪽수 ?? '')
  if (!match) return null
  return { start: Number(match[1]), end: Number(match[2]) }
}

// 여러 차시를 가진 학습주제의 교과서 쪽수를 하나의 범위로 합쳐서 보여준다.
export function formatPageRange(lessons) {
  const ranges = (lessons ?? []).map((l) => parsePageRange(l.쪽수)).filter(Boolean)
  if (ranges.length === 0) return ''
  const start = Math.min(...ranges.map((r) => r.start))
  const end = Math.max(...ranges.map((r) => r.end))
  return start === end ? `${start}쪽` : `${start}~${end}쪽`
}
