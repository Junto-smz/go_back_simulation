import { calculateTrip, formatDuration } from './calculator.js';

const $ = id => document.getElementById(id);
const destination = $('destination');
const countInput = $('trip-count');
const number = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 });
let data = null;
let announcementTimer;

function render() {
    if (!data) return;
    const count = countInput.value === '' ? NaN : Number(countInput.value);
    document.querySelectorAll('[data-count]').forEach(button => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.count) === count));
    });
    $('decrease').disabled = !Number.isSafeInteger(count) || count <= 0;
    clearTimeout(announcementTimer);
    try {
        const result = calculateTrip(data, destination.value, count);
        countInput.removeAttribute('aria-invalid');
        $('count-error').hidden = true;
        $('result-content').hidden = false;
        $('result-placeholder').hidden = true;
        $('result-destination').textContent = destination.value;
        $('result-count').textContent = `年${number.format(count)}回`;
        $('total-cost').textContent = number.format(result.totalCost);
        $('total-time').textContent = formatDuration(result.totalMinutes);
        $('monthly-cost').textContent = number.format(result.monthlyCost);
        $('unit-cost').textContent = number.format(result.cost);
        $('unit-time').textContent = formatDuration(result.minutes);
        announcementTimer = setTimeout(() => {
            $('result-announcement').textContent = `${destination.value}へ年${count}回。年間交通費${number.format(result.totalCost)}円、年間移動時間${formatDuration(result.totalMinutes)}。`;
        }, 300);
    } catch (error) {
        countInput.setAttribute('aria-invalid', 'true');
        $('count-error').textContent = error.message;
        $('count-error').hidden = false;
        $('result-content').hidden = true;
        $('result-placeholder').hidden = false;
        $('result-placeholder').textContent = '入力内容を確認すると、計算結果が表示されます。';
        $('result-announcement').textContent = '';
    }
}

async function loadData() {
    $('load-error').hidden = true;
    $('input-fields').disabled = true;
    document.querySelector('.results').setAttribute('aria-busy', 'true');
    $('result-placeholder').hidden = false;
    $('result-placeholder').textContent = '帰省データを読み込んでいます…';
    try {
        const response = await fetch('./cost.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const loaded = await response.json();
        if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded) || !Object.keys(loaded).length) {
            throw new Error('Invalid cost data');
        }
        for (const name of Object.keys(loaded)) calculateTrip(loaded, name, 1);
        data = loaded;
        destination.replaceChildren(...Object.keys(data).map(name => new Option(name, name)));
        destination.value = Object.hasOwn(data, '東京都') ? '東京都' : Object.keys(data)[0];
        $('input-fields').disabled = false;
        render();
    } catch {
        data = null;
        $('result-content').hidden = true;
        $('result-placeholder').textContent = 'データを読み込めませんでした。';
        $('load-error-message').textContent = location.protocol === 'file:'
            ? 'JSONを読み込むにはWebサーバーが必要です。プロジェクトで「python -m http.server 8000」を実行し、http://localhost:8000 を開いてください。'
            : 'cost.json を読み込めませんでした。ファイルの配置・内容や接続を確認し、もう一度お試しください。';
        $('load-error').hidden = false;
    } finally {
        document.querySelector('.results').setAttribute('aria-busy', 'false');
    }
}

$('trip-form').addEventListener('submit', event => { event.preventDefault(); render(); });
destination.addEventListener('change', render);
countInput.addEventListener('input', render);
document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
    countInput.value = button.dataset.count;
    render();
}));
for (const [id, increment] of [['decrease', -1], ['increase', 1]]) {
    $(id).addEventListener('click', () => {
        const current = Number(countInput.value);
        countInput.value = Number.isSafeInteger(current) && current >= 0 ? Math.max(0, current + increment) : 0;
        render();
    });
}
$('retry-button').addEventListener('click', loadData);
loadData();
