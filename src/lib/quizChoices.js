// Choices used to be plain strings; they're now { text, imageUrl } objects so
// a multiple-choice question can show a picture next to each option. This
// normalizes either shape so old quizzes keep rendering correctly.
export function normalizeChoice(choice) {
  if (typeof choice === 'string') return { text: choice, imageUrl: '' }
  return { text: choice?.text ?? '', imageUrl: choice?.imageUrl ?? '' }
}
