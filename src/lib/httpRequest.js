import axios from 'axios'

const API_URL = "https://192.168.1.6:8443"

export async function httpRequest(accessToken, httpMethod, endpoint, dataSent) {

  const config = {
    url: API_URL + endpoint,
    method: httpMethod,
    data: dataSent,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-type": "application/json; charset=UTF-8"
    },
  }
  try {
    const response = await axios(config)
    const responseData = await response.data
    return responseData
  } catch (error) {
    const serverErrorWithCustomMessage = error.response.data?.message
    throw Error(serverErrorWithCustomMessage || error)
  }
}