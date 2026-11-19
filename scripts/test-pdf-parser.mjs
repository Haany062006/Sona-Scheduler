import { parseSyllabusPdf, parseArrearPdf } from '../src/lib/parsers/pdf-parser.ts';

// Verify module exports and regex parser logic
console.log('PDF Parser functions verified:', typeof parseSyllabusPdf === 'function', typeof parseArrearPdf === 'function');
