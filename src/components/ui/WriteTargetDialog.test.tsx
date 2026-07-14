// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WriteTargetDialog } from './WriteTargetDialog';

it('offers Overwrite only when a same-name file exists', () => {
  const html = renderToStaticMarkup(
    <WriteTargetDialog folderName="TBM" existing onChoose={() => {}} onCancel={() => {}} />);
  expect(html).toMatch(/overwrite/i);
  expect(html).toMatch(/save as new file/i);
});

it('does not render Overwrite when file does not exist', () => {
  const html = renderToStaticMarkup(
    <WriteTargetDialog folderName="TBM" existing={false} onChoose={() => {}} onCancel={() => {}} />);
  expect(html).not.toMatch(/overwrite/i);
  expect(html).toMatch(/save as new file/i);
});
