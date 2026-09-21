const pending = new Map();

function setPending(phone, results) {
  pending.set(phone, results);
}
function getPending(phone) {
  return pending.get(phone);
}
function clearPending(phone) {
  pending.delete(phone);
}

module.exports = { setPending, getPending, clearPending };