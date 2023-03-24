import json
import os
import random
import sys

import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.protobuf.json_format import MessageToDict
from rest_framework import generics
from rest_framework import status
from rest_framework.decorators import renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from bot.models.model_intents import Intent, Bot
from bot.models.model_web_bot import WebBot
from botData.models.model_bot_ratings import BotRating
from botData.models.model_fallbacks import FallbackMessage
from botData.models.model_feedback_form import Message, FeedbackForm
from botPlatform.models.model_botuser import BotUserInfo
from botPlatform.models.model_platform import Platform
from nlp_lib.dialogflow_apis import detect_intent
from nlp_lib.rasa_detect_intent import rasa_detect_intent
from teams.models import ConversationParameters
from webbot.views.webbot_template import webbot_response_format
from botPlatform.forms.botuser_info_form import BotUserInfoForm
# Create your views here.
class WebbotWebhook(generics.GenericAPIView):
    permission_classes = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.request_data = None
        self.agent_request_body=None
        self.received_msg = None
        self.conversation_id = None
        self.user = None
        self.bot_id = None
        self.web_uid = None
        self.platform = Platform.objects.filter(name='web')
        self.nlp_agent = None
        self.agentId = None
        

    def post(self, request, *arg, **kwargs):
        try:
           # print('post data',request.data['website_user'])
            self.request_data = request.data
            print(self.request_data)
            #print('website-user',self.request_data('website_user'))
            if request.data['website_user']==False:
                a=self.request_data.get('web_uid').index('/')
                #self.request_data.get('web_uid')
                #self.request_data.get('web_uid')[:a]
                #self.web_uid ="488bb99b-8b93-
                self.web_uid=self.request_data.get('web_uid')[:a]
            else:    
               self.web_uid = self.request_data.get('web_uid')
           
            self.bot_id = Bot.objects.filter(web_uid=self.web_uid).first()
            if not self.web_uid or not self.bot_id:
                response_msg = webbot_response_format(msg={"text": "Bot does not exists."},
                                                      params={})
                data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
                return JsonResponse(status=status.HTTP_200_OK, data=data)
            msg = json.loads(self.request_data['userInput'])
            self.received_msg = msg.get('input_message') if msg.get('input_message') else msg
            self.process_info()
            print('check-0',self.user_verified,self.website_user)
            if (not self.user_verified or self.user_verified == False or self.user_verified == "false") and self.website_user:
                print("user is not verified ghsgdh", self.user_verified, self.website_user)
                msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                response_msg = webbot_response_format(msg=msg, params={})
                data = {"data": {"response_messages": response_msg, "authentic_user": self.user_verified}}
                return Response(status=status.HTTP_200_OK, data=data)

            if self.nlp_agent.type == 'rasa':
                response_msg = self.rasa_api()
            elif self.nlp_agent.type == 'dialogflow':
                response_msg = self.dialogflow_api()
            # response_msg = {"data": {"response_messages": [{"type": "text", "content": {"text": ["hi", "hello"]}}]}}
            # response_msg = webbot_response_format(msg={"form": "hi"}, params={})
            # if self.user_exists:
            #     bot_msg = Message(type='bot', message=response_msg, bot_id=self.bot_id, user_id=self.user_exists)
            #     bot_msg.save()
            #     user_msg = Message(type='user', message=self.received_msg, bot_id=self.bot_id, user_id=self.user_exists)
            #     user_msg.save()
            data = {"data": {"response_messages": response_msg, "authentic_user": self.user_verified,
                             "user_identity": self.user_identity}}
            print('post-data',data)        
            # return Response(status=status.HTTP_200_OK, data=data)
        except Exception as e:
            print("process message exception", e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            response_msg = webbot_response_format(msg={"text": "Sorry, for inconvenience."},
                                                  params={})
            data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
        if self.user_exists:
            bot_msg = Message(type='bot', message=response_msg, bot_id=self.bot_id, user_id=self.user_exists)
            bot_msg.save()
            user_msg = Message(type='user', message=self.received_msg, bot_id=self.bot_id, user_id=self.user_exists)
            user_msg.save()

        return Response(status=status.HTTP_200_OK, data=data)

    def process_info(self):
        try:
            self.platform_id = Platform.objects.filter(config={"web_uid": self.web_uid}).first()
            self.website_user = self.request_data.get('website_user')
            print('exeeeeeee',self.website_user)
            self.user_verified = self.request_data.get('user_verified')
            self.bot_id = Bot.objects.filter(web_uid=self.web_uid).first()
            if (self.user_verified == False or self.user_verified == "false") and self.website_user == True:
                return "User not verified"
            self.user = json.loads(self.request_data.get('web_user')) if self.request_data.get('web_user') else None
            if self.request_data.get('web_user'):
                user_data = json.loads(self.request_data['web_user'])
                if user_data.get('user_identity'):
                    self.user = user_data
                else:
                    self.user = {"user_identity": user_data}
            self.conversation_id = self.user['user_identity'] if self.user else self.request_data['web_session']
            self.user_identity = self.user['user_identity'] if self.user else None
            print('exeeeeeee',self.website_user)
            
             
            self.user_exists = BotUserInfo.objects.filter(info__contains={"userIdentity": self.conversation_id}).first()
            self.nlp_agent = self.bot_id.nlp_agent
        except Exception as e:

            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print('process info', exc_type, fname, exc_tb.tb_lineno)

    def dialogflow_api(self):
        print('dialogflow hit')
        service_account_info = self.nlp_agent.config
        try:
            intent_res = detect_intent(service_account_info=service_account_info, input_message=self.received_msg,
                                       session_id=self.conversation_id)
            df_intent = intent_res.query_result.intent.display_name
            df_parameters = intent_res.query_result.parameters
            context = None
            if intent_res.query_result.output_contexts:
                output_context = intent_res.query_result.output_contexts
                list_key = []
                for i in output_context:
                    key_len = len(i.parameters.keys())
                    list_key.append(key_len)
                max_key = list_key.index(max(list_key))
                context = output_context[max_key].parameters
                # context = intent_res.query_result.output_contexts[len(intent_res.query_result.output_contexts)-1].parameters
            parameters = context if context is not None else df_parameters
            print(df_intent)

            # db_intent = Intent.objects.get(name=df_intent)
            db_intent = Intent.objects.get(name=df_intent, bot_id=self.bot_id)
            if intent_res.query_result.all_required_params_present:
                if db_intent.name == 'nlu_fallback' or db_intent.name == 'Default Fallback Intent' and not self.user_verified == 'false':
                    msg_id = Message.objects.filter(user_id=self.user_exists, type='user').last()
                    store_fallback_msg = FallbackMessage(bot_id=self.bot_id, user_id=self.user_exists,
                                                         message_id=msg_id)
                    store_fallback_msg.save()
                if db_intent.response:
                    print('database call')
                    if not self.user_verified == 'false':
                        response_msg = webbot_response_format(msg=db_intent.response, params=parameters)
                    else:
                        msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                        response_msg = webbot_response_format(msg=msg, params=parameters)
                elif db_intent.webhook:
                    print('webhook call',self.user_verified)
                    if self.user_verified == 'true':
                       
                        parameters = MessageToDict(parameters)
                        response_msg = self.webhook_call(intent_name=df_intent, parameters=parameters)
                    else:
                        msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                        response_msg = webbot_response_format(msg=msg, params=parameters)   
            elif not intent_res.query_result.all_required_params_present:
                fulfillment_msg = {"text": intent_res.query_result.fulfillment_text}
                response_msg = webbot_response_format(msg=fulfillment_msg, params={})
        except Exception as e:
            print(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            response_msg = webbot_response_format(msg={"text": "Sorry, an error occurred , please try again."},
                                                  params={})
        # response_msg = temp.
        return response_msg

    def rasa_api(self):
        try:
            res = rasa_detect_intent(self.received_msg, self.conversation_id, self.bot_id)
            intent_res = res['intent_res']
            print('intent----------------------------------->',intent_res)
            df_intent = intent_res['queryResult']['intent']['displayName']
            print('df_intent',df_intent,'intentDetectionConfidence',intent_res['queryResult']['intentDetectionConfidence'])
            parameters = res['parameters']
            parameters['intentDetectionConfidence']=intent_res['queryResult']['intentDetectionConfidence']
            print('parameters-rasaaaaaaaa',parameters)
            db_intent = Intent.objects.filter(name=df_intent, bot_id=self.bot_id).first()
            if db_intent.name == 'nlu_fallback' or db_intent.name == 'Default Fallback Intent' or db_intent.name == 'Default FallbackIntent' and not self.user_verified == 'false':
                msg_id = Message.objects.filter(user_id=self.user_exists, type='user').last()
                print('msg id', msg_id)
                store_fallback_msg = FallbackMessage(bot_id=self.bot_id, user_id=self.user_exists,
                                                     message_id=msg_id)
                store_fallback_msg.save()

            if db_intent.response:
                print( db_intent.response.get('set_entity'),"rasa_set_entity")
                if not self.user_verified == 'false':
                    response_msg = webbot_response_format(msg=db_intent.response, params=parameters)
                else:
                    msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                    response_msg = webbot_response_format(msg=msg, params=parameters)
                if db_intent.response.get('set_entity'):
                   for entity in db_intent.response['set_entity']:
                       print(entity)
                       parameters.update(entity)
                       conv_obj = ConversationParameters.objects.filter(
                           conversation_id=self.conversation_id).first() if ConversationParameters.objects.filter(
                           conversation_id=self.conversation_id).first() else ConversationParameters(
                           conversation_id=self.conversation_id)
                       conv_obj.parameters = parameters
                       conv_obj.save()
                       print('updated param', parameters)
            elif db_intent.webhook:
                print('webhook call inside rasa api',self.user_verified)
                if not self.user_verified == 'false':
                    response_msg = self.webhook_call(intent_name=df_intent, parameters=parameters)
        
                else:
                    msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                    response_msg = webbot_response_format(msg=msg, params=parameters)  
                   
        except Exception as e:
            print(e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            response_msg = webbot_response_format(msg={"text": "Hi, an error occured please try again."},
                                                  params=parameters)

        return response_msg

    def webhook_call(self, intent_name, parameters):
        try:
            intent_url = Intent.objects.filter(name=intent_name, bot_id=self.bot_id).first().webhook
            webhook_url = intent_url['webhook_url']
            # webhook_url = 'http://10.83.145.69:8020/webhook/service' "255060830204780"
            print('inside_webhook_call',self.user_exists)
            self.website_user = self.request_data.get('website_user')
            if self.website_user==False:
                #print('inside-false-if', self.agentId,'aaaaaaaaaaaaaaaaa')
                a=self.request_data.get('web_uid').index('/')
                agentid = json.loads(self.request_data.get('web_uid')[a+9:])
                #print(a,'hellllooooo',agentid['user_identity'])
                self.user_exists = BotUserInfo.objects.filter(info__contains={"userIdentity":agentid['user_identity']}).first()
                #print(self.user_exists)

            user_id = self.user_exists.info.get('userIdentity', None) if self.user_exists else None
            print('user-id',user_id)
            # parameters.update(user_id)
            body = {
                "intent_name": intent_name,
                "teams_email": self.user_exists.email if self.user_exists else None,
                "user_identity": user_id,
                # "teams_email": "mansi.gupta.ff@hitachi-systems.com",
                # "teams_email": "neha.turan.ec@hitachi-systems.com",
                # "teams_email": "Jay.khanna.ep@hitachi-systems.com",
                "parameters": parameters,
                "user_query": self.received_msg,
                "flow_name": intent_name
            }

            payload = json.dumps(body)
            print(payload)
            headers = {
                'Content-Type': 'application/json'
            }
            response = requests.post(url=webhook_url, headers=headers, data=payload, verify=False)
            print('webhook response', response.text.encode('utf8'))
            response = json.loads(response.text)
            print('json-response',response)
            out_response = response['response'] if response != "{}" else "{'text':'hi'}"
            print(response.get('authentic_user') and intent_name == 'email_otp2')

            if response.get('authentic_user') and intent_name == 'email_otp2':
                if response.get('userProfile'):
                    userProfile = response.get('userProfile')
                    user = BotUserInfo.objects.filter(
                        info__contains={"userIdentity": userProfile['userIdentity']}).first()
                    if not user:
                        bot_user = BotUserInfo(name=userProfile['userName'] if userProfile.get('userName') else "Null",
                                               email=userProfile['userEmail'],
                                               platform_id=self.platform_id,
                                               info=userProfile)
                        bot_user.save()
                        print("user saved")

                    self.user_verified = True
                    self.user_identity = userProfile['userIdentity']
                out_message = webbot_response_format(msg=out_response, params=parameters)
            elif not response.get('authentic_user'):
                if intent_name in ['email_otp2', 'Email_Verify']:
                    out_message = webbot_response_format(msg=out_response, params=parameters)
                elif self.user_verified:
                    out_message = webbot_response_format(msg=out_response, params=parameters)
                else:
                    msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                    out_message = webbot_response_format(msg=msg, params=parameters)
        except Exception as e:
            print("webhook exception", e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            msg = {"text": "Hi, an error occured please try again."}
            out_message = webbot_response_format(msg, {})
        return out_message

    @csrf_exempt
    @renderer_classes(JSONRenderer)
    def user_info(self, *arg, **kwargs):
        try:
            request_body = self.body
            request_body = json.loads(request_body)
            web_user = request_body.get('web_user')
            print('web-user',web_user)
            if request_body.get('website_user')==False:
                print('exeeee')
                a=request_body.get('web_uid').index('/')        
                web_uid=request_body.get('web_uid')[:a]
                #web_uid="488bb99b-8b93-44d1-8f1c-117c74b814f4"
            else:    
                print('scripts',request_body)
                web_uid = request_body.get('web_uid')

            #web_user = request_body.get('web_user')
           # print('web-user',web_user)
            bot_exists = Bot.objects.filter(web_uid=web_uid).first()
            print('bot-exists',bot_exists)
            if not web_uid or not bot_exists:
                print("inside-bot-not")
                response_msg = webbot_response_format(msg={"text": "Bot does not exists."},
                                                      params={})
                data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
                return JsonResponse(status=status.HTTP_200_OK, data=data)
            bot_id = Bot.objects.filter(web_uid=web_uid).first()

            platform = Platform.objects.filter(config={"web_uid": web_uid}).first()

            print('exe test',request_body['web_user'])
            self.web_user=request_body.get('website_user')
            if request_body.get('website_user')==False:
                    print('inside-false')
                    a=request_body.get('web_uid').index('/')
                    
                    agentid = json.loads(request_body.get('web_uid')[a+9:])
                    #form_data = {"Code": emp_code}
                    self.agent_request_body=agentid['user_identity'] 
                    userIdentity=agentid['user_identity']
                    self.agentId=userIdentity
                    print(self.agentId,'ddddddddddd')
                    form_data = {"user_identity": userIdentity,"Website_user":False}
                    intent_url = Intent.objects.filter(name="get_user_info", bot_id=bot_id).first().webhook
                    webhook_url = intent_url['webhook_url']
                    # webhook_url = 'http://10.83.145.69:8020/webhook/service'
                    tt = form_data
                    body = {
                        "intent_name": "get_user_info",
                        "parameters": {'form_data':form_data},
                        'form_data':tt,
                        "flow_name": "get_user_info"

                    }

                    payload = json.dumps(body)
                    print(payload,"edrtfyghudshfdsfjdfjdhnhk")
                    headers = {
                        'Content-Type': 'application/json'
                    }
                    response = requests.post(url=webhook_url, headers=headers, data=payload, verify=False)
                    print(response.text)
                    out_response = json.loads(response.text)['response'] if response != "{}" else "{'text':'hi'}"
                    response_msg = webbot_response_format(msg=out_response,
                                                        params={})
                    #print(response_msg)

                    response = json.loads(response.text)
                    #userProfile = response['userProfile']
                    #print('iiiiiiii',userProfile)
                    if response['authentic_user']:
                        userProfile = response['userProfile']
                        print('------------------',userProfile)
                        user_email = userProfile['userEmail'] if userProfile.get('userEmail') else 'email'
                        user_identity = response['userProfile']['userIdentity']
                        user_check = BotUserInfo.objects.filter(email=user_email, platform_id=platform,
                                                                info__contains={"userIdentity": user_identity}).first()
                        if not user_check:
                            bot_user = BotUserInfo(name=userProfile['userName'] if userProfile.get('userName') else "Null",
                                                email=user_email, platform_id=platform,
                                                info=userProfile)
                            bot_user.save()
                            print("user saved")
                        data = {
                            "data": {"response_messages": response_msg, "authentic_user": "true", "user_email": user_email,
                                    "user_identity": user_identity}}
                    elif not response['authentic_user']:
                        data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
                    return JsonResponse(status=status.HTTP_200_OK, data=data)


            if request_body['web_user'] == '{}' or not request_body['web_user']:
                # intent_url = Intent.objects.filter(name="get_user_info", bot_id=bot_id).first().response
                msg = Intent.objects.filter(name="default_first_msg", bot_id=bot_id).first().response
                res = webbot_response_format(msg=msg,
                                             params={})
                # response_msg = webbot_response_format(msg=intent_url,
                #                                       params={})
                data = {"data": {"response_messages": res, "authentic_user": "false"}}
            elif request_body['web_user'] != '{}':
                print('hello not empty web user')
                web_user = json.loads(request_body['web_user'])
                # 
                userInfo = BotUserInfo.objects.filter(info__contains={"userIdentity": web_user['user_identity']})
                print('testttttttttttttt',len(userInfo),web_user['user_identity']) 

                if len(userInfo)==0:
                    print('inside if')
                    msg = Intent.objects.filter(name="default_first_msg", bot_id=bot_id).first().response
                    res = webbot_response_format(msg=msg, params={})
                    data = {"data": {"response_messages": res, "authentic_user": "false"}}
                else:    
                    for i in userInfo:
                        code=i.__dict__
                        emp_code=code['info']['Emp_code']
                    form_data = {"Code": emp_code}    
                    # param = {"user_identity": "140690333410026"}
                    intent_url = Intent.objects.filter(name="get_user_info", bot_id=bot_id).first().webhook
                    webhook_url = intent_url['webhook_url']
                    # webhook_url = 'http://10.83.145.69:8020/webhook/service'
                    tt = form_data
                    body = {
                        "intent_name": "get_user_info", 
                        "parameters": {'form_data':form_data},
                        'form_data':tt,
                        "flow_name": "get_user_info"
                        
                    }

                    payload = json.dumps(body)
                    print(payload,"edrtfyghudshfdsfjdfjdhnhk")
                    headers = {
                        'Content-Type': 'application/json'
                    }
                    response = requests.post(url=webhook_url, headers=headers, data=payload, verify=False)
                    print(response.text)
                    out_response = json.loads(response.text)['response'] if response != "{}" else "{'text':'hi'}"
                    response_msg = webbot_response_format(msg=out_response,
                                                        params={})
                    print(response_msg)

                    response = json.loads(response.text)
                    
                    if response['authentic_user']:
                        userProfile = response['userProfile']
                        print('------------------',userProfile)
                        user_email = userProfile['userEmail'] if userProfile.get('userEmail') else 'email'
                        user_identity = response['userProfile']['userIdentity']
                        user_check = BotUserInfo.objects.filter(email=user_email, platform_id=platform,
                                                                info__contains={"userIdentity": user_identity}).first()
                        if not user_check:
                            bot_user = BotUserInfo(name=userProfile['userName'] if userProfile.get('userName') else "Null",
                                                email=user_email, platform_id=platform,
                                                info=userProfile)
                            bot_user.save()
                            print("user saved")
                        data = {
                            "data": {"response_messages": response_msg, "authentic_user": "true", "user_email": user_email,
                                    "user_identity": user_identity}}
                    elif not response['authentic_user']:
                        data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
            return JsonResponse(status=status.HTTP_200_OK, data=data)
        except Exception as e:
            print("user info exception", e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            response_msg = webbot_response_format(msg={"text": "Sorry, for inconvenience."},
                                                  params={})
            data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
            return JsonResponse(status=status.HTTP_200_OK, data=data)

    @csrf_exempt
    @renderer_classes(JSONRenderer)
    def submit_form(self, *arg, **kwargs):
        try:
            if self.POST.get('data'):
                request_body = (self.POST.get('data'))
            else:
                request_body = self.body.decode('utf8')
            request_body = json.loads(request_body)
            print('form body', request_body)
            web_uid = request_body['web_uid']
            platform = Platform.objects.filter(config={"web_uid": web_uid}).first()
            self.bot_id = platform.bot_id
            if request_body.get('user_verified') and (
                    request_body.get('user_verified') == 'true' or request_body.get('user_verified') == True):
                userid = json.loads(request_body['web_user'])
                print(userid)
                user = BotUserInfo.objects.filter(info__contains={"userIdentity": json.loads(userid)['user_identity']},
                                                  platform_id=platform).first()

                print(user)

                if request_body['form_name'] == 'feedback_form':
                    msg = request_body['form_data']['feedback_text']
                    msg_id = Message.objects.filter(user_id=user, type='user').order_by('-updated_at')[1]
                    user_msg = FeedbackForm(user_message=msg, bot_id=platform.bot_id, user_id=user, message_id=msg_id)
                    user_msg.save()
                    response_msg = webbot_response_format(msg={"text": "Thanks for your feedback"},
                                                          params={})
                    data = {"data": {"response_messages": response_msg, "authentic_user": "true"}}
                elif request_body['form_name'] == 'file_upload':

                    intent_url = Intent.objects.filter(name="file_upload", bot_id=self.bot_id).first().webhook
                    webhook_url = intent_url['webhook_url']
                    body = {
                        "intent_name": "file_upload",
                        # "parameters": param,
                        "flow_name": "file_upload"
                    }
                    body.update(request_body)

                    payload = json.dumps(body)
                    print(payload)

                    response = requests.post(url=webhook_url, files=self.FILES, data=body,
                                             verify=False)
                    print(response)
                    response = json.loads(response.text)
                    out_response = response['response'] if response != "{}" else "{'text':'hi'}"
                    response_msg = webbot_response_format(msg=out_response,
                                                          params={})
                    data = {"data": {"response_messages": response_msg, "authentic_user": "true"}}

                elif request_body['form_name'] == 'ticketUpdate_form':
                    self.user_exists = user
                    self.conversation_id = self.user_identity = userid['user_identity']
                    self.platform_id = platform
                    self.received_msg = 'update_ticket'
                    self.user_verified = True
                    print(request_body['form_data'])
                    params = {
                        'ticket_id': request_body['form_data']['incident_no'],
                        'description': request_body['form_data']['description_text'],
                        'summary': request_body['form_data']['summary']
                    }
                    res = WebbotWebhook.webhook_call(self, intent_name='update_ticket', parameters=params)
                    data = {"data": {"response_messages": res, "authentic_user": "true"}}
                elif request_body['form_name'] == 'bot_ratings':
                    rating = request_body['bot_rating']
                    rate_obj = BotRating(user_id=user, bot_id=self.bot_id, rating=rating)
                    rate_obj.save()
                    msg = Intent.objects.filter(name="feedback").first().response
                    res = webbot_response_format(msg=msg,
                                                 params={})
                    data = {"data": {"response_messages": res, "authentic_user": "true"}}
            elif request_body['form_name'] == 'userinfo_form':
                print("555555555555555")
                username = request_body['form_data'].get('username')
                email = request_body['form_data'].get('email')
                phone = request_body['form_data'].get('PhoneNo')
                userid = request_body['web_session']
                info_json = {"contact_info": phone, "userIdentity": userid}
                user_exists = BotUserInfo.objects.filter(
                    info__contains={"userIdentity": userid}).first()

                param = {
                    "new_user": False if user_exists == [] else True,
                    "user_identity": userid,
                    "form_data": request_body['form_data']
                }
                # param = {"user_identity": "140690333410026"}
                intent_url = Intent.objects.filter(name="get_user_info", bot_id=self.bot_id).first().webhook
                webhook_url = intent_url['webhook_url']
                # webhook_url = 'http://10.83.145.69:8020/webhook/service'
                body = {
                    "intent_name": "get_user_info",
                    "parameters": param,
                    "flow_name": "get_user_info"
                }

                payload = json.dumps(body)
                print(payload)
                headers = {
                    'Content-Type': 'application/json'
                }
                response = requests.post(url=webhook_url, headers=headers, data=payload, verify=False)
                print("webhook response ", response.text)
                out_response = json.loads(response.text)['response'] if response != "{}" else "{'text':'hi'}"
                response_msg = webbot_response_format(msg=out_response,
                                                      params={})
                print(response_msg)

                if (not user_exists or user_exists == []) and json.loads(response.text).get('authentic_user'):
                    bot_user = BotUserInfo(
                        name=username if username else json.loads(response.text).get('userProfile').get('userName'),
                        email=email if email else json.loads(response.text).get('userProfile').get('userEmail'),
                        platform_id=platform,
                        info=info_json if info_json else json.loads(response.text).get('userProfile'))
                    bot_user.save()
                print("User saved 1")

                data = {"data": {"response_messages": response_msg,
                                 "authentic_user": json.loads(response.text).get('authentic_user')}}

            elif request_body['form_name'] == 'userinfo_form_by_code':
                print("5555555555555558888888888888")
                emp_code = request_body['form_data'].get('Code')
                print('emp',emp_code)
                userid = request_body['web_session']
                info_json = {"Emp_code": emp_code, "userIdentity": userid,'website_user':True}
                user_exists = BotUserInfo.objects.filter(
                    info__contains={"Emp_code": emp_code}).first()
                
                param = {
                    "new_user": False if user_exists == [] else True,
                    "user_identity": userid,
                    "form_data": request_body['form_data']
                }
                print('userInfoooooo222222',user_exists)


                # user_exists.delete()
                # param = {"user_identity": "140690333410026"}
                intent_url = Intent.objects.filter(name="get_user_info", bot_id=self.bot_id).first().webhook
                webhook_url = intent_url['webhook_url']
                # webhook_url = 'http://10.83.145.69:8020/webhook/service'
                body = {
                    "intent_name": "get_user_info",
                    "parameters": param,
                    "flow_name": "get_user_info"
                }

                payload = json.dumps(body)
                print(payload)
                headers = {
                    'Content-Type': 'application/json'
                }
                response = requests.post(url=webhook_url, headers=headers, data=payload, verify=False)
                print("webhook response ", response.text)
                out_response = json.loads(response.text)['response'] if response != "{}" else "{'text':'hi'}"
                response_msg = webbot_response_format(msg=out_response,
                                                      params={})
                print('response-msg',response_msg)
                print('ganesh----',json.loads(response.text)) 
                username =json.loads(response.text).get('userProfile').get('userName')
                email=json.loads(response.text).get('userProfile').get('userEmail')
                print('user-name',username,email)
                
                   

                if (not user_exists or user_exists == []) and json.loads(response.text).get('authentic_user'):
                    bot_user = BotUserInfo(
                        name=username,
                        email=email,
                        platform_id=platform,
                        info=info_json if info_json else json.loads(response.text).get('userProfile'))
                    bot_user.save()
                    print("User saved 1")

                elif user_exists != [] or user_exists != None:
                    user_id = BotUserInfo.objects.filter(
                    info__contains={"Emp_code": emp_code}).first()
                    print('update11111',user_id)
                    print('inknfodsdsddsd',user_id.id)
                    info_json = {"Emp_code": emp_code, "userIdentity": userid}
                    bot_user = BotUserInfo.objects.get(id=user_exists.id)
                    bot_user.info=info_json
                    bot_user.save()
                    print('info32333232',bot_user.info)
                    print('infoooooo222222222222222222222222222',bot_user)

                data = {"data": {"response_messages": response_msg,
                                 "authentic_user": json.loads(response.text).get('authentic_user')}}

            elif request_body.get('user_verified') == 'false':
                msg = Intent.objects.filter(name="default_user_verify", bot_id=self.bot_id).first().response
                res = webbot_response_format(msg=msg,
                                             params={})
                data = {"data": {"response_messages": res, "authentic_user": "true"}}

            return JsonResponse(status=status.HTTP_200_OK, data=data)

        except Exception as e:
            print("form submition exception", e)
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(exc_type, fname, exc_tb.tb_lineno)
            response_msg = webbot_response_format(msg={"text": "Sorry, for inconvenience."},
                                                  params={})
            data = {"data": {"response_messages": response_msg, "authentic_user": "false"}}
            return JsonResponse(status=status.HTTP_200_OK, data=data)

    @csrf_exempt
    @renderer_classes(JSONRenderer)
    def rasa_load_test(self, *arg, **kwargs):
        try:
            request_body = self.body
            request_body = json.loads(request_body)
            print(request_body)
            web_uid = request_body.get('web_uid')
            bot_id = Bot.objects.filter(web_uid=web_uid).first()
            conversation_id = random.randint(0, 9999)
            random_no = random.randint(0, 9)
            messages = ['hi', 'IT operations', 'enable bluetooth', 'system issues', 'can you help me with pycharm',
                        'yammer',
                        'HMS', 'get host details', 'recent 5 alerts', 'opportunity won']
            res = rasa_detect_intent(received_msg=messages[random_no], conversation_id=conversation_id, bot_id=bot_id)
            print('000000000000000000000000000000000000000000', random_no, )

            return JsonResponse(status=status.HTTP_200_OK, data=res)

        except Exception as e:
            print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', e)
            return JsonResponse(status=status.HTTP_400_BAD_REQUEST, data=e)