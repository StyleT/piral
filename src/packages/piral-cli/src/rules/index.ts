import { readdir } from 'fs';
import { RuleContext, PiralRuleContext, PiletRuleContext, Rule } from '../types';

const piralRules: Array<Rule<PiralRuleContext>> = [];
const piletRules: Array<Rule<PiletRuleContext>> = [];

function getRules<T extends RuleContext>(target: 'pilet' | 'piral') {
  const prefix = `${target}-`;

  return new Promise<Array<Rule<T>>>((resolve, reject) => {
    readdir(__dirname, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(name => name.startsWith(prefix))
            .map(name => {
              const rule = require(`./${name}`).default;
              rule.name = name.substr(prefix.length).replace(/\.ts$/, '');
              return rule;
            }),
        );
      }
    });
  });
}

export function addPiralRule(rule: Rule<PiralRuleContext>) {
  piralRules.push(rule);
}

export async function getPiralRules() {
  const rules = await getRules<PiralRuleContext>('piral');
  return [...rules, ...piralRules];
}

export function addPiletRule(rule: Rule<PiletRuleContext>) {
  piletRules.push(rule);
}

export async function getPiletRules() {
  const rules = await getRules<PiletRuleContext>('pilet');
  return [...rules, ...piletRules];
}
