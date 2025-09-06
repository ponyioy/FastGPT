import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
import { type ReadRawTextByBuffer, type ReadFileResponse } from '../type';
import axios from 'axios';
import FormData from 'form-data';
type TokenType = {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
};

export const readPdfFile = async ({
  buffer,
  pdfApiUrl
}: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
    try {
        // 借用 doc2xKey 存 API URL
        const apiUrl = pdfApiUrl || 'http://100.100.1.134:7233/v1/parse/file_v2';
        const headers = form.getHeaders();
        delete headers.host;
        // 构造 multipart/form-data
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'file.pdf',
          contentType: 'application/pdf'
        });

        // POST 请求到 API
        const res = await axios.post(apiUrl, form, {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        // FastAPI 返回的 markdown 字段即 PDF 解析内容
        return {
          rawText: res.data?.markdown ?? ''
            };
      } catch (error) {
        console.error('PDF HTTP 解析失败:', error);
        return { rawText: '', error: String(error) };
      }
};