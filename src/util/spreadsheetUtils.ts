
/**
 * transform column index, starts from 1, to column name, like A, AB, etc
 * @param columnNumber column number starts from 1
 */
export function getExcelColumnName (columnNumber: number): string {
  let dividend = columnNumber
  let columnName = ''
  let modulo

  while (dividend > 0) {
    modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = (dividend - modulo) / 26
    dividend = parseInt(dividend.toString())
  }

  return columnName
}
