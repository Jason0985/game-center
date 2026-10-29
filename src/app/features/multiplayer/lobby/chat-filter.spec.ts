import { censor } from './chat-filter';

describe('censor', () => {
  it('replaces rude words with stars and keeps the rest', () => {
    expect(censor('Das ist doch Scheiße!')).toBe('Das ist doch *******!');
    expect(censor('du Arschloch')).toBe('du *********');
    expect(censor('FUCK this')).toBe('**** this');
  });

  it('catches compounds, repeated letters and numbers for letters', () => {
    expect(censor('Scheißspiel')).toBe('***********');
    expect(censor('Spielscheiße')).toBe('************');
    expect(censor('fuuuuck')).toBe('*******');
    expect(censor('$h1t')).toBe('****');
  });

  it('leaves harmless words alone', () => {
    const text = 'Marsch, Scheibe, Hurra, Niger, Spaß, Geschichte, Klasse, dick';
    expect(censor(text)).toBe(text);
  });
});
