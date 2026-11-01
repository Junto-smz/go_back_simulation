export function calculateTrip(data, destination, count) {
    if (!Object.hasOwn(data, destination)) throw new Error('目的先の都道府県を選択してください。');
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('帰省回数は0以上の整数で入力してください。');
    const { cost, minutes } = data[destination];
    if (![cost, minutes].every(value => Number.isSafeInteger(value) && value >= 0)) {
        throw new Error('目的地の交通費・移動時間のデータが正しくありません。');
    }
    const totalCost = cost * count;
    const totalMinutes = minutes * count;
    if (![totalCost, totalMinutes].every(Number.isSafeInteger)) {
        throw new Error('帰省回数が大きすぎます。小さい値を入力してください。');
    }
    return { cost, minutes, totalCost, totalMinutes, monthlyCost: totalCost / 12 };
}

export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder}分`;
    return `${hours.toLocaleString('ja-JP')}時間${remainder ? `${remainder}分` : ''}`;
}
