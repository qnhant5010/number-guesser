/**
 * In-place shuffle
 * @param [array] array to shuffle
 */
function shuffleInPlace<T>(array: T[]) {
    let count = array.length,
        randomnumber,
        temp;
    while (count) {
        randomnumber = Math.random() * count-- | 0;
        temp = array[count];
        array[count] = array[randomnumber];
        array[randomnumber] = temp
    }
    return array;
}

export { shuffleInPlace };