import { useEffect, useRef, useState } from 'react'

import chat from '../../assets/chat.png'
import Input from '../../components/Input'
import { io } from 'socket.io-client'
import Button from '../../components/Button'

const Dashboard = () => {
	const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')))
	const [conversations, setConversations] = useState([])
	const [messages, setMessages] = useState({})
	const [message, setMessage] = useState('')
	const [users, setUsers] = useState([])
	const [socket, setSocket] = useState(null)
	const messageRef = useRef(null)

	useEffect(() => {
		setSocket(io('http://localhost:8080'))
	}, [])

	useEffect(() => {
		socket?.emit('addUser', user?.id);
		socket?.on('getUsers', users => {
			console.log('activeUsers :>> ', users);
		})
		socket?.on('getMessage', data => {
			setMessages(prev => ({
				...prev,
				messages: [...prev.messages, { user: data.user, message: data.message }]
			}))
		})
	}, [socket])

	useEffect(() => {
		messageRef?.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages?.messages])

	useEffect(() => {
		const loggedInUser = JSON.parse(localStorage.getItem('user:detail'))
		const fetchConversations = async () => {
			const res = await fetch(`http://localhost:8000/api/conversations/${loggedInUser?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setConversations(resData)
		}
		fetchConversations()
	}, [])

	useEffect(() => {
		const fetchUsers = async () => {
			const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setUsers(resData)
		}
		fetchUsers()
	}, [])

	const fetchMessages = async (conversationId, receiver) => {
		const res = await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});
		const resData = await res.json()
		setMessages({ messages: resData, receiver, conversationId })
	}

	const sendMessage = async (e) => {
		setMessage('')
		socket?.emit('sendMessage', {
			senderId: user?.id,
			receiverId: messages?.receiver?.receiverId,
			message,
			conversationId: messages?.conversationId
		});
		const res = await fetch(`http://localhost:8000/api/message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				conversationId: messages?.conversationId,
				senderId: user?.id,
				message,
				receiverId: messages?.receiver?.receiverId
			})
		});
	}
	const handleLogout = async () => {
		console.log("1")
		try {
			const token = localStorage.getItem('user:token');
			console.log(token,"tokkennn")
			const response = await fetch('http://localhost:8000/api/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
			if (response.ok) {
				localStorage.removeItem('user:token'); 
				window.location.href = 'users/sign_in';
			} else {
				console.log('Logout failed:', await response.text());
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	};
	
	return (
		<div className='w-screen flex'>
			<div className='w-[25%] h-screen bg-secondary overflow-scroll'>
				<div className='flex items-center my-8 mx-14'>
					<div><img src={chat} width={75} height={75} className='border border-primary p-[2px] rounded-full' /></div>
					<div className='ml-8'>
						<h3 className='text-2xl'>{user?.fullName}</h3>
						<p className='text-lg font-light'>My Account</p>
					</div>
				</div>
				<div className='flex justify-center my-8'> 
                    <button onClick={handleLogout}>Logout</button>
                </div>
				 <hr />
				{/*<div className='mx-14 mt-10'>
					<div className='text-primary text-lg'>Messages</div>
					<div>
						{
							conversations.length > 0 ?
								conversations.map(({ conversationId, user }) => {
									return (
										<div className='flex items-center py-8 border-b border-b-gray-300'>
											<div className='cursor-pointer flex items-center' onClick={() => fetchMessages(conversationId, user)}>
												<div><img src={chat} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
												<div className='ml-6'>
													<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
													<p className='text-sm font-light text-gray-600'>{user?.email}</p>
												</div>
											</div>
										</div>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Conversations</div>
						}
					</div>
				</div> */}
				
			</div>
			
			<div className='w-[50%] h-screen bg-white flex flex-col items-center'>
				{
					messages?.receiver?.fullName &&
					<div className='w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2'>
						<div className='cursor-pointer'><img src={chat} width={60} height={60} className="rounded-full" /></div>
						<div className='ml-6 mr-auto'>
							<h3 className='text-lg'>{messages?.receiver?.fullName}</h3>
							<p className='text-sm font-light text-gray-600'>{messages?.receiver?.email}</p>
						</div>
						<div className='cursor-pointer'>
							
						</div>
					</div>
				}
				<div className='h-[75%] w-full overflow-scroll shadow-sm'>
					<div className='p-14'>
						{
							messages?.messages?.length > 0 ?
								messages.messages.map(({ message, user: { id } = {} }) => {
									return (
										<>
										<div className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?.id ? 'bg-primary text-white rounded-tl-xl ml-auto' : 'bg-secondary rounded-tr-xl'} `}>{message}</div>
										<div ref={messageRef}></div>
										</>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Messages or No Conversation Selected</div>
						}
					</div>
				</div>
				{
					messages?.receiver?.fullName &&
					<div className='p-14 w-full flex items-center'>
						<Input placeholder='Type a message...' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[75%]' inputClassName='p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none' />
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`} onClick={() => sendMessage()}>
							<svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send" width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<line x1="10" y1="14" x2="21" y2="3" />
								<path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
							</svg>
						</div>
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`}>
							
						</div>
					</div>
				}
			</div>
			<div className='w-[25%] h-screen bg-light px-8 py-16 overflow-scroll'>
				<div className='text-primary text-lg'>People</div>
				<div>
					{
						users.length > 0 ?
							users.map(({ userId, user }) => {
								return (
									<div className='flex items-center py-8 border-b border-b-gray-300'>
										<div className='cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)}>
											<div><img src={chat} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
											<div className='ml-6'>
												<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
												<p className='text-sm font-light text-gray-600'>{user?.email}</p>
											</div>
										</div>
									</div>
								)
							}) : <div className='text-center text-lg font-semibold mt-24'>No Conversations</div>
					}
				</div>
			</div>
		</div>
	)
}

export default Dashboard