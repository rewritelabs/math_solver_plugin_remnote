export const extractOptions = (
  mathExpression: string
): [string, { size?: 'LARGE' | 'SMALL'; order?: 'NONE' | 'LEX' }] => {
  const lines = mathExpression.split('\n');
  const options = lines[0].split(' ');
  const optionsObj: any = {};

  for (const option of options) {
    if (option === 'large') {
      optionsObj['size'] = 'LARGE';
    } else if (option === 'ordered') {
      optionsObj['order'] = 'LEX';
    } else {
      return [mathExpression, {}];
    }
  }

  if (Object.keys(optionsObj).length === 0) {
    return [mathExpression, {}];
  }

  return [lines.slice(1).join('\n'), optionsObj];
};

export function daysSince2025() {
  const now = new Date();
  const currentUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds()
  );
  const jan1_2025_UTC = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
  const diffInMs = currentUTC - jan1_2025_UTC;
  const oneDayInMs = 86400000;
  return Math.floor(diffInMs / oneDayInMs);
}
