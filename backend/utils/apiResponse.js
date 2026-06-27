const ok  = (res, data, status = 200)       => res.status(status).json({ success: true,  ...data })
const err = (res, message, status = 400)     => res.status(status).json({ success: false, message })
const created = (res, data)                  => ok(res, data, 201)
const notFound = (res, msg = 'Not found')    => err(res, msg, 404)
const forbidden = (res, msg = 'Forbidden')   => err(res, msg, 403)
const serverError = (res, e) => {
  console.error(e)
  return err(res, e?.message || 'Server error', 500)
}

module.exports = { ok, err, created, notFound, forbidden, serverError }
