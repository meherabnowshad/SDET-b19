import {expect} from 'chai';
import {doSum, doSub} from './math.js';

describe("Math functions", () => {
    it('should return the sum of two numbers', () => {
        let result = doSum(2, 3);
        expect(result).to.equal(5)
    })
    it('should return the difference of two numbers', () => {
        let result = doSub(5, 3);
        expect(result).to.equal(2)
    })
})