import { normalizeChoice } from '../lib/quizChoices.js'

// 사이트 퀴즈(Firestore quizzes 문서)를 게임용 문제로 바꾼다. 게임 화면에서는
// 보기를 눌러 답하므로 객관식과 OX만 쓰고, 단답형은 제외한다.
export function toGameQuestion(quiz) {
  if (quiz.type === 'multiple-choice') {
    const choices = (quiz.choices ?? []).map(normalizeChoice)
    if (choices.length < 2 || !(quiz.answerIndex >= 0 && quiz.answerIndex < choices.length)) return null
    return { id: quiz.id, prompt: quiz.question, choices, answerIndex: quiz.answerIndex }
  }
  if (quiz.type === 'ox') {
    if (quiz.answer !== 'O' && quiz.answer !== 'X') return null
    return {
      id: quiz.id,
      prompt: quiz.question,
      choices: [
        { text: 'O', imageUrl: '' },
        { text: 'X', imageUrl: '' },
      ],
      answerIndex: quiz.answer === 'O' ? 0 : 1,
    }
  }
  return null
}

export function toGameQuestions(quizzes) {
  return quizzes.map(toGameQuestion).filter(Boolean)
}

// 문제를 섞어서 차례로 꺼내 주는 덱. 다 쓰면 다시 섞되, 방금 낸 문제가
// 곧바로 다시 나오지 않게 한다. 객관식 보기 순서도 매번 섞는다.
export function createQuestionDeck(questions, rng = Math.random) {
  let order = []
  let last = null

  function refill() {
    order = questions.slice()
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    if (order.length > 1 && order[order.length - 1] === last) {
      ;[order[0], order[order.length - 1]] = [order[order.length - 1], order[0]]
    }
  }

  return {
    size: questions.length,
    next() {
      if (questions.length === 0) return null
      if (order.length === 0) refill()
      const q = order.pop()
      last = q
      return shuffleChoices(q, rng)
    },
  }
}

function shuffleChoices(q, rng) {
  // OX는 O가 항상 왼쪽에 있어야 헷갈리지 않는다.
  if (q.choices.length === 2 && q.choices[0].text === 'O' && q.choices[1].text === 'X') return q
  const idx = q.choices.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return {
    ...q,
    choices: idx.map((i) => q.choices[i]),
    answerIndex: idx.indexOf(q.answerIndex),
  }
}
