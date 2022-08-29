import axios from 'axios'

//const API_URL = "https://192.168.1.6:8443"
const API_URL = "https://api-todo.glgmsh.com"

export async function httpRequest(accessToken, httpMethod, endpoint, data) {

  const config = {
    url: API_URL + endpoint,
    method: httpMethod,
    data: data,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-type": "application/json; charset=UTF-8"
    },
  }
  try {
    const response = await axios(config)
    return await response.data
  } catch (error) {
    const serverErrorWithCustomMessage = error.response.data?.message
    throw Error(serverErrorWithCustomMessage || error)
  }
}
