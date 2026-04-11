import sys
import json
import traceback
import jmcomic
import re
import base64
from duckduckgo_search import DDGS

def search_comic(query):
    try:
        client = jmcomic.JmOption.default().build_jm_client()
        # Ensure we only get the first page
        page = client.search_site(search_query=query, page=1)
        results = []
        for item in page:
            # item is usually (album_id, title)
            # or it could be a tuple of (album_id, title, [tags])
            album_id = item[0] if isinstance(item, tuple) else getattr(item, 'id', None)
            title = item[1] if isinstance(item, tuple) and len(item) > 1 else getattr(item, 'title', getattr(item, 'name', 'Unknown'))
            if album_id:
                results.append({
                    'id': album_id,
                    'title': title,
                    'image': f"https://cdn-18comic.art/media/albums/{album_id}_3x4.jpg"
                })
        return results
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}

def get_real_comments(client, album_id):
    try:
        ts = jmcomic.jm_toolkit.time_stamp()
        token, tokenparam = jmcomic.JmCryptoTool.token_and_tokenparam(ts, secret=jmcomic.JmMagicConstants.APP_TOKEN_SECRET_2)
        headers = {
            'token': token,
            'tokenparam': tokenparam,
            'user-agent': 'Mozilla/5.0 (Linux; Android 7.1.2; DT1901A Build/N2G47O; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.198 Mobile Safari/537.36',
            'accept-encoding': 'gzip',
        }
        domain = client.domain_list[0] if client.domain_list else 'www.cdnhjk.net'
        url = f'https://{domain}/forum'
        resp = client.get(url, params={'aid': str(album_id), 'page': '1', 'mode': 'manhua'}, headers=headers)
        data = resp.json().get('data')
        if not data:
            return []
        
        decrypted = jmcomic.JmCryptoTool.decode_resp_data(data, ts)
        comment_list = json.loads(decrypted).get('list', [])
        
        results = []
        for c in comment_list:
            raw_content = c.get('content', '')
            # Remove HTML tags
            clean_content = re.sub(r'<[^>]+>', '', raw_content).strip()
            if clean_content:
                results.append(clean_content)
        return results
    except Exception as e:
        print(f"Failed to get real comments: {e}", file=sys.stderr)
        return []

def search_ddg(query, max_results=12):
    try:
        results = DDGS().text(query, max_results=max_results)
        return [res['body'] for res in results]
    except Exception as e:
        print(f"DDG search failed: {e}", file=sys.stderr)
        return []

def get_image_base64(client, album_id):
    try:
        # We can use the client to fetch the image to avoid blocking
        domain = client.domain_list[0] if client.domain_list else 'cdn-18comic.art'
        url = f'https://{domain}/media/albums/{album_id}_3x4.jpg'
        resp = client.get(url)
        return base64.b64encode(resp.content).decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch image for {album_id}: {e}", file=sys.stderr)
        return ""

def search_author_context(authors):
    results = []
    if isinstance(authors, str):
        authors = [authors]
    for author in authors:
        if not author: continue
        query = f"{author} 漫画作者 作品 风格 评价"
        res = search_ddg(query)
        results.append({"author": author, "context": res})
    return results

def get_comic_detail(album_id, skip_search=False):
    try:
        client = jmcomic.JmOption.default().build_jm_client()
        album = client.get_album_detail(album_id)
        
        tags = list(album.tags) if hasattr(album, 'tags') else []
        description = album.description if hasattr(album, 'description') else ""
        
        # Try to get comments via API
        comments = get_real_comments(client, album_id)
        
        # If no comments, try web search context
        search_context = []
        title = album.title if hasattr(album, 'title') else ""
        if title and not skip_search:
            # Add some context using duckduckgo
            search_context = search_ddg(f"{title} 同人志 漫画 评价 避雷")
            
        authors = album.author if hasattr(album, 'author') else []
        author_context = []
        if not skip_search:
            author_context = search_author_context(authors)
        
        image_base64 = get_image_base64(client, album_id)
            
        return {
            'id': album.album_id if hasattr(album, 'album_id') else album_id,
            'title': title,
            'description': description,
            'tags': tags,
            'author': authors,
            'comments': comments,
            'search_context': search_context,
            'author_context': author_context,
            'image_base64': image_base64
        }
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input data"}))
            return
            
        req = json.loads(input_data)
        action = req.get('action')
        
        if action == 'search':
            res = search_comic(req.get('query', ''))
            print(json.dumps({"success": True, "data": res}))
        elif action == 'detail':
            res = get_comic_detail(req.get('id'), req.get('skip_search', False))
            print(json.dumps({"success": True, "data": res}))
        else:
            print(json.dumps({"error": "Unknown action"}))
    except Exception as e:
        print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))

if __name__ == '__main__':
    main()
