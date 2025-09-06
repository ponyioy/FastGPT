import axios from 'axios';
import FormData from 'form-data';
import http from 'http';
import https from 'https';
import { type ReadRawTextByBuffer, type ReadFileResponse } from '../type';


export const readPdfFile = async ({
  buffer,
  pdfApiUrl
}: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
    try {
        // 借用 doc2xKey 存 API URL
        const apiUrl = pdfApiUrl?.trim() || 'http://100.100.1.134:7233/v1/parse/file_v2';
        console.log('[PDF] apiUrl:', apiUrl);

        if (!apiUrl) {
          throw new Error('PDF API URL 未配置');
        }

        // 打印 buffer 长度，确认数据存在
        console.log('[PDF] buffer length:', buffer?.length);
        // 构造 multipart/form-data
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'file.pdf',
          contentType: 'application/pdf'
        });

        // 展开 headers 并加上可选 token
        const headers = {
          ...form.getHeaders()
        };

        console.log('[PDF] headers:', headers);
        // Node HTTP/HTTPS adapter 保证 URL 被正确解析
        const instance = axios.create({
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
          timeout: 600_000 // 10 分钟
        });

        const res = await instance.post(apiUrl, form, {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        console.log('[PDF] response keys:', Object.keys(res.data || {}));

        // FastAPI 返回的 markdown 字段即 PDF 解析内容
        return {
          rawText: res.data?.markdown ?? ''
            };
      } catch (error) {
        console.error('PDF HTTP 解析失败:', error);
        return { rawText: '', error: String(error) };
      }
};