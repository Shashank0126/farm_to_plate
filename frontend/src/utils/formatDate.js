import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const fmtDate    = (d) => d ? format(parseISO(d), 'dd MMM yyyy')         : '—'
export const fmtDateTime= (d) => d ? format(parseISO(d), 'dd MMM yyyy, HH:mm') : '—'
export const fmtAgo     = (d) => d ? formatDistanceToNow(parseISO(d), { addSuffix: true }) : '—'
export const fmtShort   = (d) => d ? format(parseISO(d), 'MMM d')              : '—'
