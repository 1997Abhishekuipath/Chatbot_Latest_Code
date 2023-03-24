import os
import sys


def webbot_response_format(msg, params):
    try:
        print('new-template',msg.get('intentDetectionConfidence'))
        response_msg = []
        if msg.get('append_text'):
            param_list = []
            for i in msg['append_text']:
                param_list.append(params.get(i, ""))
            text_msg = msg['text'].format(*param_list)
        else:
            text_msg = msg.get('text') if msg.get('text') else msg.get('data')

        if msg.get('text') or msg.get('data'):
            message = {"type": "text", "content": {"text": [text_msg]}}
            response_msg.append(message)
        
        #if msg.get('intentDetectionConfidence'):
         #   message = {"type": "intentDetectionConfidence", "content": {"intentDetectionConfidence": [msg['intentDetectionConfidence']]}}
          #  response_msg.append(message)

        if msg.get('buttons'):
            message = {"type": "button", "content": {"buttons": msg['buttons']}}
            response_msg.append(message)

        if msg.get('links'):
            message = {"type": "link", "content": {"links": msg['links']}}
            response_msg.append(message)

        if msg.get('form'):
            message = msg.get('form')
            response_msg.append(message)

        if msg.get('intentDetectionConfidence'):
            message = {"type": "intentDetectionConfidence", "content": {"intentDetectionConfidence": [msg['intentDetectionConfidence']]}}
            response_msg.append(message)

        print(response_msg)
        # data = {"data": {"response_messages": [{"type": "text", "content": {"text": ["hi", "hello"]}}]}}
        return response_msg
    except Exception as e:
        print(e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
        response_msg = webbot_response_format(msg={"text": "Sorry, an error occurred , please try again."},
                                              params={})
        return response_msg
