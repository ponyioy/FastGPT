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
        console.log('[PDF] 输入参数 pdfApiUrl:', pdfApiUrl);
        console.log('[PDF] 输入参数 pdfApiUrl 类型:', typeof pdfApiUrl);

        // ✅ 关键修复：严格验证 URL
        let apiUrl = '';
        if (typeof pdfApiUrl === 'string' && pdfApiUrl.trim() && pdfApiUrl !== 'undefined') {
            apiUrl = pdfApiUrl.trim();
        } else {
            apiUrl = 'http://100.100.1.134:7233/v1/parse/file';
        }

        console.log('[PDF] 最终使用的 apiUrl:', apiUrl);

        // ✅ 验证 URL 格式
        try {
            const urlObj = new URL(apiUrl);
            console.log('[PDF] URL 解析成功:', {
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                port: urlObj.port,
                pathname: urlObj.pathname
            });

            if (!urlObj.hostname || urlObj.hostname === 'undefined') {
                throw new Error('Hostname 无效');
            }
        } catch (urlError) {
            console.error('[PDF] URL 解析失败:', urlError);
            throw new Error(`无效的 API URL: ${apiUrl}`);
        }

        // 打印 buffer 信息
        console.log('[PDF] buffer length:', buffer?.length);
        console.log('[PDF] buffer type:', typeof buffer);

        // 确保 buffer 有效
        if (!buffer || buffer.length === 0) {
          throw new Error('PDF buffer 为空或无效');
        }

        // 确保 buffer 是 Buffer 类型
        let pdfBuffer: Buffer;
        if (typeof buffer === 'string') {
          pdfBuffer = Buffer.from(buffer, 'base64');
        } else if (buffer instanceof ArrayBuffer) {
          pdfBuffer = Buffer.from(buffer);
        } else if (Buffer.isBuffer(buffer)) {
          pdfBuffer = buffer;
        } else {
          // 尝试转换
          try {
            pdfBuffer = Buffer.from(buffer);
          } catch (bufError) {
            throw new Error('无法转换 buffer 数据');
          }
        }

        // 构造 multipart/form-data
        const form = new FormData();
        form.append('file', pdfBuffer, {
          filename: 'file.pdf',
          contentType: 'application/pdf'
        });

        const headers = {
          ...form.getHeaders()
        };

        console.log('[PDF] headers:', headers);

        // ✅ 使用最简单直接的方式调用
        const res = await axios({
          method: 'POST',
          url: apiUrl,
          data: form,
          headers: headers,
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
          timeout: 600_000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        console.log('[PDF] response keys:', Object.keys(res.data || {}));

        return {
          rawText: res.data?.markdown ?? ''
        };
      } catch (error) {
        console.error('PDF HTTP 解析失败:', error);
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return { rawText: '', error: String(error) };
      }
};