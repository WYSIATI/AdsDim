import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

/** Loads an HTML fixture into the jsdom document body and returns it. */
export function loadFixture(name: string): Document {
  const html = readFileSync(join(FIXTURES_DIR, name), 'utf8');
  document.body.innerHTML = html;
  return document;
}

/** Returns the fixture article with the given data-fixture-id. */
export function fixtureArticle(doc: Document, fixtureId: string): Element {
  const article = doc.querySelector(`article[data-fixture-id="${fixtureId}"]`);
  if (!article) throw new Error(`Fixture article not found: ${fixtureId}`);
  return article;
}

/** All fixture articles in document order. */
export function allFixtureArticles(doc: Document): readonly Element[] {
  return [...doc.querySelectorAll('article[data-testid="tweet"]')];
}
