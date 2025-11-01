import PTApi from "@/api/platform";
import type { AxiosResponse } from "axios";
import type { LogFileInfo } from "@/types/pt-type";
// 从文件名中提取时间段
const extractTimeRangeFromFileName = (
    fileName: string
): { startTime: Date | null; endTime: Date | null } => {
    // 匹配文件名中的时间格式：YYYYMMDD-HHMMSS_YYYYMMDD-HHMMSS
    const timePattern = /(\d{8})-(\d{6})_(\d{8})-(\d{6})/;
    const match = fileName.match(timePattern);

    if (!match) {
        console.log("No time pattern match in fileName:", fileName);
        return { startTime: null, endTime: null };
    }

    const [, startDate, startTime, endDate, endTime] = match;
    console.log("Extracted time parts:", { startDate, startTime, endDate, endTime });

    // 解析开始时间
    const startYear = parseInt(startDate.substring(0, 4));
    const startMonth = parseInt(startDate.substring(4, 6)) - 1; // 月份从0开始
    const startDay = parseInt(startDate.substring(6, 8));
    const startHour = parseInt(startTime.substring(0, 2));
    const startMinute = parseInt(startTime.substring(2, 4));
    const startSecond = parseInt(startTime.substring(4, 6));

    // 解析结束时间
    const endYear = parseInt(endDate.substring(0, 4));
    const endMonth = parseInt(endDate.substring(4, 6)) - 1;
    const endDay = parseInt(endDate.substring(6, 8));
    const endHour = parseInt(endTime.substring(0, 2));
    const endMinute = parseInt(endTime.substring(2, 4));
    const endSecond = parseInt(endTime.substring(4, 6));

    const startDateTime = new Date(
        startYear,
        startMonth,
        startDay,
        startHour,
        startMinute,
        startSecond
    );
    const endDateTime = new Date(endYear, endMonth, endDay, endHour, endMinute, endSecond);

    console.log("Parsed dates:", {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
    });

    return { startTime: startDateTime, endTime: endDateTime };
};
export const isTimeInRangeUseDate = (fileName: string, dateTime: Date): boolean => {
    const { startTime, endTime } = extractTimeRangeFromFileName(fileName);
    if (!startTime || !endTime) {
        console.log("Failed to extract time range from fileName:", fileName);
        return false;
    }
    return dateTime >= startTime && dateTime <= endTime;
}
export const isTimeInRangeUseNumber = (fileName: string, dateTime: number): boolean => {
    const date = new Date(dateTime);
    return isTimeInRangeUseDate(fileName, date);
}
// 判断问题时间是否在日志时间范围内
export const isTimeInRangeUseString = (fileName: string, dateTime: string): boolean => {
    if (!dateTime) {
        console.log("No dateTime in fileName");
        return false;
    }

    // 解析问题时间 - 尝试多种格式
    let problemTime: Date;
    try {
        problemTime = new Date(dateTime);
        // 如果解析失败，尝试其他格式
        if (isNaN(problemTime.getTime())) {
            // 尝试替换格式，比如将空格替换为T
            const isoFormat = dateTime.replace(" ", "T");
            problemTime = new Date(isoFormat);
        }
    } catch (error) {
        console.error("Failed to parse problem time:", dateTime, error);
        return false;
    }

    if (isNaN(problemTime.getTime())) {
        console.error("Invalid problem time:", dateTime);
        return false;
    }
    return isTimeInRangeUseDate(fileName, problemTime);
};
export const openJiraFileWithDownload = async (aipCode: string, logFile: LogFileInfo) => {
    try {
        // TODO 本地有文件了就不在请求
        let url: string = "";
        await PTApi.getFileDownloadUrl(logFile.objName)
            .then((data: AxiosResponse) => {
                console.log("data:", data);
                url = data as unknown as string;
                console.log("file url", url);
            })
            .catch()
            .finally();
        const url_match = url.match(/https?:\/\/[^/]+(\/.+)/);
        if (url_match !== null) {
            console.log("url_match:", url_match);
            try {
                const { success, content, message } = await (window as any).electronAPI.openJiraFile(
                    aipCode,
                    logFile.name,
                    url_match[0]
                );
                if (!success) {
                    throw new Error(message);
                }
                return content;
            } catch (error) {
                console.error("Error processing tar.gz file:", error);
                throw new Error(`处理文件 ${logFile.name} 时出错: ${error}`);
            }
        } else {
            console.log("download file:can't find match params,url:", url);
            throw new Error("无法获取文件下载链接");
        }
    } catch (error) {
        console.error("Error downloading file:", error);
        throw new Error(`下载文件 ${logFile.name} 时出错`);
    }
}