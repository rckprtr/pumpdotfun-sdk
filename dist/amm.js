export class AMM {
    virtualSolReserves;
    virtualTokenReserves;
    realSolReserves;
    realTokenReserves;
    initialVirtualTokenReserves;
    constructor(virtualSolReserves, virtualTokenReserves, realSolReserves, realTokenReserves, initialVirtualTokenReserves) {
        this.virtualSolReserves = virtualSolReserves;
        this.virtualTokenReserves = virtualTokenReserves;
        this.realSolReserves = realSolReserves;
        this.realTokenReserves = realTokenReserves;
        this.initialVirtualTokenReserves = initialVirtualTokenReserves;
    }
    static fromGlobalAccount(global) {
        return new AMM(global.initialVirtualSolReserves, global.initialVirtualTokenReserves, 0n, global.initialRealTokenReserves, global.initialVirtualTokenReserves);
    }
    static fromBondingCurveAccount(bonding_curve, initialVirtualTokenReserves) {
        return new AMM(bonding_curve.virtualSolReserves, bonding_curve.virtualTokenReserves, bonding_curve.realSolReserves, bonding_curve.realTokenReserves, initialVirtualTokenReserves);
    }
    getBuyPrice(tokens) {
        const product_of_reserves = this.virtualSolReserves * this.virtualTokenReserves;
        const new_virtual_token_reserves = this.virtualTokenReserves - tokens;
        const new_virtual_sol_reserves = product_of_reserves / new_virtual_token_reserves + 1n;
        const amount_needed = new_virtual_sol_reserves > this.virtualSolReserves ? new_virtual_sol_reserves - this.virtualSolReserves : 0n;
        return amount_needed > 0n ? amount_needed : 0n;
    }
    applyBuy(token_amount) {
        const final_token_amount = token_amount > this.realTokenReserves ? this.realTokenReserves : token_amount;
        const sol_amount = this.getBuyPrice(final_token_amount);
        this.virtualTokenReserves = this.virtualTokenReserves - final_token_amount;
        this.realTokenReserves = this.realTokenReserves - final_token_amount;
        this.virtualSolReserves = this.virtualSolReserves + sol_amount;
        this.realSolReserves = this.realSolReserves + sol_amount;
        return {
            token_amount: final_token_amount,
            sol_amount: sol_amount
        };
    }
    applySell(token_amount) {
        this.virtualTokenReserves = this.virtualTokenReserves + token_amount;
        this.realTokenReserves = this.realTokenReserves + token_amount;
        const sell_price = this.getSellPrice(token_amount);
        this.virtualSolReserves = this.virtualSolReserves - sell_price;
        this.realSolReserves = this.realSolReserves - sell_price;
        return {
            token_amount: token_amount,
            sol_amount: sell_price
        };
    }
    getSellPrice(tokens) {
        const scaling_factor = this.initialVirtualTokenReserves;
        const token_sell_proportion = (tokens * scaling_factor) / this.virtualTokenReserves;
        const sol_received = (this.virtualSolReserves * token_sell_proportion) / scaling_factor;
        return sol_received < this.realSolReserves ? sol_received : this.realSolReserves;
    }
}
