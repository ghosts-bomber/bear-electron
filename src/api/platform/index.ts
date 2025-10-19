import { getPFToken } from "@/utils/auth";
import request from "@/utils/request-pt";
import download from "@/utils/request-down";
const PTApi = {
  login(data: PTLoginData) {
    return request({
      url: "/service/pro/ndp/user/login",
      method: "get",
      params: data,
    });
  },
  searchApi(aip: string, sType: string) {
    return request({
      url: "/service/pro/ndp/aicar/faultReport/page",
      method: "get",
      params: {
        pageIndex: 1,
        pageSize: 10,
        jiraIssueKey: aip,
        access_token: getPFToken(),
        type: sType,
      },
    });
  },
  aipDataInfo(aipId: number) {
    return request({
      url: "/service/pro/ndp/aicar/faultReport/task/file",
      method: "get",
      params: {
        id: aipId,
        access_token: getPFToken(),
      },
    });
  },
  getFileDownloadUrl(objName: string) {
    return request({
      url: "/service/pro/ndp/aicar/obs/signedUrl",
      method: "get",
      params: {
        objName: objName,
        access_token: getPFToken(),
      },
    });
  },
  downloadFile(url: string) {
    return download({
      url: url,
      method: "get",
      responseType: "arraybuffer",
    });
  },
};

export default PTApi;

export interface PTLoginData {
  username: string;
  password: string;
}
