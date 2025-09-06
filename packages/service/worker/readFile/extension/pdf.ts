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

        // ✅ 关键修复：确保 buffer 是有效的 Buffer 对象
        if (!buffer || buffer.length === 0) {
          throw new Error('PDF buffer 为空或无效');
        }
        console.log('[PDF] buffer type:', typeof buffer);

        // 确保 buffer 是 Buffer 类型
        let pdfBuffer: Buffer;
        if (typeof buffer === 'string') {
          // 如果是 base64 字符串
          pdfBuffer = Buffer.from(buffer, 'base64');
        } else if (buffer instanceof ArrayBuffer) {
          // 如果是 ArrayBuffer
          pdfBuffer = Buffer.from(buffer);
        } else if (Buffer.isBuffer(buffer)) {
          // 如果已经是 Buffer
          pdfBuffer = buffer;
        } else {
          throw new Error('PDF buffer 格式不支持');
        }

        // 构造 multipart/form-data
        const form = new FormData();
        form.append('file', pdfBuffer, {
          filename: 'file.pdf',
          contentType: 'application/pdf'
        });

        // 展开 headers 并加上可选 token
        const headers = {
          ...form.getHeaders()
        };

        console.log('[PDF] headers:', headers);


        // 替换原来的 instance.post 调用
        const res = await axios.post(apiUrl, form, {
          headers,
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
          timeout: 600_000,
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