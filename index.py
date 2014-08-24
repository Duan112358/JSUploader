import web
import os
import json
import re
import base64
from datetime import date
from uuid import uuid4

urls =(
    '/', 'Upload',
    )
app = web.application(urls, globals())
session = web.session.Session(app, web.session.DiskStore('sessions'), initializer={'count':0})

def csrf_token():
    if not session.has_key('csrf_token'):
        session.csrf_token = uuid4().hex
    return session.csrf_token

def csrf_protected(f):

    def decorated(*args, **kwargs):

        inp = web.input()
        if not (inp.has_key('csrf_token') and inp.csrf_token != session.pop('csrf_token', None)):
            raise web.HTTPError('400 Bad request', {'content-type':'application/json'}, '400 bad request, CROSS SITE REQUEST FORGERY (CSRF)')
        return f(*args, **kwargs)
    return decorated

render = web.template.render('templates', globals={'csrf_token':csrf_token})

class Upload():
    def GET(self):
        return render.index()

    @csrf_protected
    def POST(self):
        today = date.today()

        inp = web.input()
        callback = inp.get('callback', '')
        jsformat = inp.get('format','scripts')
        result = {}

        # check and create dir if not exists
        if not os.path.exists('static/uploads/%s' % today.month):
            os.mkdir('static/uploads/%s' % today.month, 0777)
        filedir = 'static/uploads/%s/%s' % (today.month, today.day)
        if not os.path.exists(filedir):
            os.mkdir(filedir, 0777)

        # retrieve and save the uploaded file
        if 'img' in inp:
            myfile = inp['img'].replace('_', '=')
            base64_index = myfile.find('base64,')
            ext = re.search(r'^data:image/(?P<ext>\w+)\;base64,', myfile).group('ext')
            myfile = myfile[(base64_index + 7):]
            filename = '%s.%s' % (uuid4().hex, ext)
            savedurl =  '%s/%s' % (filedir, filename)
            fout = open(savedurl, 'w')
            fout.write(base64.decodestring(myfile))
            fout.flush()
            fout.close()

            result['url'] = savedurl
            result['msg'] = 'OK'
            if callback and jsformat:
                return '<script type="text/javascript">window.parent.%s(%s)</script>' % (callback, json.dumps(result))
        raise web.seeother('/')


if __name__ == '__main__':
    app.run()
