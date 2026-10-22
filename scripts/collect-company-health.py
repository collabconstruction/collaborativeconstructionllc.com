#!/usr/bin/env python3
"""Read-only aggregate Google/public health collection. Never prints credentials."""
import concurrent.futures, datetime as dt, json, pathlib, urllib.request, urllib.parse, urllib.error
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
TODAY = dt.datetime.now(ZoneInfo('America/New_York')).date()
OUT = ROOT / 'docs/health/runs' / TODAY.isoformat()
OUT.mkdir(parents=True, exist_ok=True)

def request(url, body=None, token=None):
    headers = {'User-Agent': 'CollaborativeConstructionHealth/1.0'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if isinstance(body, dict):
        body = json.dumps(body).encode(); headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            raw=r.read()
            if 'application/json' in r.headers.get('Content-Type',''): return json.loads(raw)
            return {'status':r.status, 'bytes':len(raw), 'retry_after':r.headers.get('Retry-After')}
    except urllib.error.HTTPError as e:
        return {'status':'unavailable','http_status':e.code,'retry_after':e.headers.get('Retry-After')}
    except Exception as e: return {'status':'unavailable','error_type':type(e).__name__}

def refresh(kind):
    try:
        if kind=='ga':
            c=json.loads((pathlib.Path.home()/'.config/gcloud/application_default_credentials.json').read_text())
            payload={k:c[k] for k in ('client_id','client_secret','refresh_token')}
        else:
            p=pathlib.Path.home()/'.cc-private/gsc'
            c=json.loads((p/'oauth-client.json').read_text()); c=c.get('installed',c.get('web'))
            t=json.loads((p/'token.json').read_text())
            payload={'client_id':c['client_id'],'client_secret':c['client_secret'],'refresh_token':t['refresh_token']}
        payload['grant_type']='refresh_token'
        result=request('https://oauth2.googleapis.com/token',urllib.parse.urlencode(payload).encode())
        return result.get('access_token')
    except Exception: return None

def ga():
    token=refresh('ga')
    if not token:return {'status':'auth_unavailable'}
    def report(start,end,dimensions,metrics,production=False):
        body={'dateRanges':[{'startDate':start,'endDate':end}], 'dimensions':[{'name':d} for d in dimensions], 'metrics':[{'name':m} for m in metrics], 'limit':100}
        if production:body['dimensionFilter']={'filter':{'fieldName':'hostName','stringFilter':{'matchType':'EXACT','value':'collaborativeconstructionllc.com'}}}
        return request('https://analyticsdata.googleapis.com/v1beta/properties/558903217:runReport',body,token)
    end=(TODAY-dt.timedelta(days=1)).isoformat(); start=(TODAY-dt.timedelta(days=28)).isoformat()
    jobs={
      'property':lambda:request('https://analyticsadmin.googleapis.com/v1beta/properties/558903217',token=token),
      'key_events':lambda:request('https://analyticsadmin.googleapis.com/v1alpha/properties/558903217/keyEvents',token=token),
      'hosts':lambda:report(start,end,['hostName'],['sessions','totalUsers','eventCount']),
      'production_totals':lambda:report(start,end,[],['sessions','totalUsers','eventCount'],True),
      'production_events':lambda:report(start,end,['eventName'],['eventCount'],True),
      'production_channels':lambda:report(start,end,['sessionDefaultChannelGroup'],['sessions','totalUsers'],True),
      'production_pages':lambda:report(start,end,['pagePath'],['screenPageViews'],True)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=dict(zip(jobs,pool.map(lambda f:f(),jobs.values())))
    return {'property_id':'558903217','start':start,'end':end,'production_filter':'exact collaborativeconstructionllc.com',**results}

def gsc():
    token=refresh('gsc')
    if not token:return {'status':'auth_unavailable'}
    end=dt.datetime.now(ZoneInfo('America/Los_Angeles')).date()-dt.timedelta(days=3);start=end-dt.timedelta(days=27)
    endpoint='https://www.googleapis.com/webmasters/v3/sites/'+urllib.parse.quote('sc-domain:collaborativeconstructionllc.com',safe='')+'/searchAnalytics/query'
    def query(a,b,dims):return request(endpoint,{'startDate':a.isoformat(),'endDate':b.isoformat(),'dimensions':dims,'type':'web','dataState':'final','rowLimit':100},token)
    jobs={'totals':lambda:query(start,end,[]),'prior_totals':lambda:query(start-dt.timedelta(days=28),end-dt.timedelta(days=28),[]),'pages':lambda:query(start,end,['page']),'queries':lambda:query(start,end,['query']),'devices':lambda:query(start,end,['device']),'daily':lambda:query(start,end,['date']),'sitemaps':lambda:request(endpoint.replace('/searchAnalytics/query','/sitemaps'),token=token)}
    for route in ('/','/general-contractor-falmouth-ma/','/adu-builder-cape-cod/'):
        jobs['inspection:'+route]=lambda route=route:request('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',{'inspectionUrl':'https://collaborativeconstructionllc.com'+route,'siteUrl':'sc-domain:collaborativeconstructionllc.com','languageCode':'en-US'},token)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=dict(zip(jobs,pool.map(lambda f:f(),jobs.values())))
    return {'property':'sc-domain:collaborativeconstructionllc.com','timezone':'America/Los_Angeles','start':start.isoformat(),'end':end.isoformat(),'dimensional_limit':100,'note':'Top rows are not guaranteed complete; keep totals independent.',**results}

def public():
    paths=['/','/robots.txt','/sitemap.xml','/general-contractor-falmouth-ma/','/home-additions-cape-cod/','/adu-builder-cape-cod/','/construction-advisory/']
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:return dict(zip(paths,pool.map(lambda p:request('https://collaborativeconstructionllc.com'+p),paths)))

if __name__=='__main__':
    jobs={'ga4':ga,'gsc':gsc,'public':public}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:result=dict(zip(jobs,pool.map(lambda f:f(),jobs.values())))
    result['fetched_at']=dt.datetime.now(dt.timezone.utc).isoformat()
    target=OUT/'google-public.json';target.write_text(json.dumps(result,indent=2)+'\n')
    print(str(target))
