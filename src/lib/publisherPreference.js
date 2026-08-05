const KEY = 'seocheon-sahoe:selected-publisher'

export function saveSelectedPublisher(publisherId) {
  localStorage.setItem(KEY, publisherId)
}

export function getSelectedPublisher() {
  return localStorage.getItem(KEY)
}
