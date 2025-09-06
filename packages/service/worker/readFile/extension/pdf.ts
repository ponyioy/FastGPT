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

        // URL 验证
        let apiUrl = '';
        if (typeof pdfApiUrl === 'string' && pdfApiUrl.trim() && pdfApiUrl !== 'undefined') {
            apiUrl = pdfApiUrl.trim();
        } else {
            apiUrl = 'http://100.100.1.134:7233/v1/parse/file';
        }

        console.log('[PDF] 最终使用的 apiUrl:', apiUrl);

        // URL 解析
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

        // Buffer 处理
        console.log('[PDF] buffer length:', buffer?.length);
        console.log('[PDF] buffer type:', typeof buffer);

        if (!buffer || buffer.length === 0) {
          throw new Error('PDF buffer 为空或无效');
        }

        let pdfBuffer: Buffer;
        if (typeof buffer === 'string') {
          pdfBuffer = Buffer.from(buffer, 'base64');
        } else if (buffer instanceof ArrayBuffer) {
          pdfBuffer = Buffer.from(buffer);
        } else if (Buffer.isBuffer(buffer)) {
          pdfBuffer = buffer;
        } else {
          pdfBuffer = Buffer.from(buffer);
        }

        // 使用原生 HTTP 客户端 ✅
        return new Promise((resolve, reject) => {
            const form = new FormData();
            form.append('file', pdfBuffer, {
                filename: 'file.pdf',
                contentType: 'application/pdf'
            });

            const headers = form.getHeaders();
            headers['Content-Length'] = form.getLengthSync();

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: headers,
                timeout: 600000
            };

            console.log('[PDF] HTTP 请求选项:', options);

            const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log('[PDF] 响应数据接收成功');
                        resolve({
                            rawText: jsonData?.markdown ?? ''
                        });
                    } catch (parseError) {
                        reject(new Error(`响应数据解析失败: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('[PDF] HTTP 请求错误:', error);
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });

            // 发送表单数据
            form.pipe(req);
        });

      } catch (error) {
        console.error('PDF HTTP 解析失败:', error);
        return { rawText: '', error: String(error) };
      }
};