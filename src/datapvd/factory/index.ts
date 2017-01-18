
import IFactory from './fac';
import * as rawv from './raw/rawv';
import constant from './raw/const';
import grow from './raw/grow';
import growrate from './raw/growrate';
import amp from './raw/amp';
import prop from './combine/prop';
import {offsetFac, offsetVFac} from './combine/offset';
import ma from './basic/ma';
import macd from './basic/macd';
import boll from './basic/boll';
import ema from './basic/ema';
import kdj from './basic/kdj';
import rsi from './basic/rsi';
import * as math from './combine/math';
import * as logic from './combine/logic';
import deviate from './ext/deviate';
import { localPeakFac } from './ext/localpeak';
import breakFac from './ext/break';
import marketdays from './ext/marketdays';
import dropdownFac from './ctx/dropdown';
import ndaysFac from './ctx/ndays';
import nholdFac from './ctx/nhold';
import stoplossFac from './ctx/stoploss';
import * as constants from '../../const';

const factories = new Map<string, IFactory<any, any>>();

factories.set(constants.dpType.raw.start, rawv.start);
factories.set(constants.dpType.raw.end, rawv.end);
factories.set(constants.dpType.raw.high, rawv.high);
factories.set(constants.dpType.raw.low, rawv.low);
factories.set(constants.dpType.raw.ex, rawv.ex);
factories.set(constants.dpType.raw.vol, rawv.vol);
factories.set(constants.dpType.raw.marketValue, rawv.marketvalue);
factories.set(constants.dpType.raw.netRate, rawv.netrate);
factories.set(constants.dpType.raw.const, constant);
factories.set(constants.dpType.raw.grow, grow);
factories.set(constants.dpType.raw.growRate, growrate);
factories.set(constants.dpType.raw.amp, amp);
factories.set(constants.dpType.basic.ma, ma);
factories.set(constants.dpType.basic.boll, boll);
factories.set(constants.dpType.basic.macd, macd);
factories.set(constants.dpType.basic.ema, ema);
factories.set(constants.dpType.basic.kdj, kdj);
factories.set(constants.dpType.basic.rsi, rsi);
factories.set(constants.dpType.combine.prop, prop);
factories.set(constants.dpType.combine.add, math.add);
factories.set(constants.dpType.combine.sub, math.sub);
factories.set(constants.dpType.combine.mul, math.mul);
factories.set(constants.dpType.combine.div, math.div);
factories.set(constants.dpType.combine.max, math.max);
factories.set(constants.dpType.combine.min, math.min);
factories.set(constants.dpType.combine.abs, math.abs);
factories.set(constants.dpType.combine.pow, math.pow);
factories.set(constants.dpType.combine.and, logic.and);
factories.set(constants.dpType.combine.or, logic.or);
factories.set(constants.dpType.combine.eq, logic.eq);
factories.set(constants.dpType.combine.gt, logic.gt);
factories.set(constants.dpType.combine.gte, logic.gte);
factories.set(constants.dpType.combine.lt, logic.lt);
factories.set(constants.dpType.combine.lte, logic.lte);
factories.set(constants.dpType.combine.between, logic.between);
factories.set(constants.dpType.combine.not, logic.not);
factories.set(constants.dpType.combine.offset, offsetFac);
factories.set(constants.dpType.combine.offsetv, offsetVFac);
factories.set(constants.dpType.ext.break, breakFac);
factories.set(constants.dpType.ext.localpeak, localPeakFac);
factories.set(constants.dpType.ext.deviate, deviate);
factories.set(constants.dpType.ctx.dropdown, dropdownFac);
factories.set(constants.dpType.ctx.ndays, ndaysFac);
factories.set(constants.dpType.ctx.nhold, nholdFac);
factories.set(constants.dpType.ctx.stoploss, stoplossFac);
factories.set(constants.dpType.ext.marketdays, marketdays);

export default factories;
