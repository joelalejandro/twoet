export default function shuffle(array) {
  let m = array.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [array[m], array[i]] = [array[i], array[m]]
  }
  return array;
}
