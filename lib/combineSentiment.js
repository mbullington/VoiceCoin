const DROP_OFF_POINT = 5;

const PHASE_1 = 0.92;
const PHASE_2 = 0.60;

module.exports = (numbers, growth) => {
    numbers = numbers.map((v, i) => {
        const nv = v * Math.pow(PHASE_1, Math.max(i, DROP_OFF_POINT));

        if (i > DROP_OFF_POINT) {
            return nv * Math.pow(PHASE_2, i - DROP_OFF_POINT);
        }

        return nv;
    });

    let total = 0;
    numbers.forEach(num => (total += num));
    
    return total + growth / 100;
};