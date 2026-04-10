import sys
import json
import traceback
import jmcomic

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

def get_comic_detail(album_id):
    try:
        client = jmcomic.JmOption.default().build_jm_client()
        album = client.get_album_detail(album_id)
        
        tags = list(album.tags) if hasattr(album, 'tags') else []
        description = album.description if hasattr(album, 'description') else ""
        
        # Try to get comments if possible, but fallback to empty list
        comments = []
        if hasattr(album, 'comments'):
            comments = album.comments
            
        return {
            'id': album.album_id if hasattr(album, 'album_id') else album_id,
            'title': album.title if hasattr(album, 'title') else "",
            'description': description,
            'tags': tags,
            'author': album.author if hasattr(album, 'author') else "",
            'comments': comments
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
            res = get_comic_detail(req.get('id'))
            print(json.dumps({"success": True, "data": res}))
        else:
            print(json.dumps({"error": "Unknown action"}))
    except Exception as e:
        print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))

if __name__ == '__main__':
    main()
