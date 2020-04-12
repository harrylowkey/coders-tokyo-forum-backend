exports.handler = (err, req, res, next) => {
  let result = {
    status: 500,
    message: "System maintenance"
  }

  if (err.isBoom) {
    console.error(err.output.statusCode, err.output.payload.message, err.output.payload.data)
    result = {
      status: err.output.statusCode,
      message: err.output.payload.message
    }
  } else {
    let status = err.status || (err.statusCode || 500)
    if (status < 500) {
      result = {
        status: status,
        message: err.message
      }
    } else {
      console.error(err)
      result = {
        status: status,
        message: "System maintenance"
      }
    }
  }

  if (result.status >= 500) {
    try {
      
      let arrStack = err.stack.split('\n')
      let message = `There is an exception: ***${err.message}*** (${req.method} ${req.url})`
      if (arrStack.length >= 2) {
        message += `\n${arrStack[1]}`
      }

      if (err.data) {
        delete err.data.password
        let data = "\nData: ```" + JSON.stringify(err.data, null, 2) + "```"
        message += data
      }
      message += `\n at **${process.env.NODE_ENV}** environment!`
    } catch (ex) {
      console.log(ex)
    }
  }
  if (result.status == 400 || result.status == 422) {
    let messIndex = result.message.indexOf('fails because [')
    if (messIndex >= 0) {
      result.message = result.message.substring(messIndex + 15, result.message.length).replace("]", "")
    }
  }
  res.status(result.status).json(result)
  next()
};
