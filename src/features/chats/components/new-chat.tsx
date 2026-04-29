import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type ChatUser } from '../data/chat-types'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Simplified user type for NewChat - messages are optional since we don't need them for search
type NewChatUser = Omit<ChatUser, 'messages'> & { messages?: ChatUser['messages'] }

type NewChatProps = {
  users: NewChatUser[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (item: { type: 'chat' | 'contact', data: any }) => void
}

interface ContactResult {
  id: string
  label: string
  description: string
  image: string
  value: string
}

export function NewChat({ users, onOpenChange, open, onSelect }: NewChatProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const [contacts, setContacts] = useState<ContactResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setContacts([])
      return
    }
  }, [open])

  useEffect(() => {
    const searchContacts = async () => {
      if (!query.trim()) {
        setContacts([])
        return
      }

      setSearching(true)
      try {
        const { data } = await api.get(`/search/contacts?search=${encodeURIComponent(query)}`)
        if (data && data.data) {
          // Filter out contacts that are already in existing chats (users)
          const existingContactIds = new Set(users.map(u => u.contactId))
          const filtered = data.data.filter((c: ContactResult) => !existingContactIds.has(c.id))
          setContacts(filtered)
        }
      } catch (err) {
        console.error('Error searching contacts:', err)
      } finally {
        setSearching(false)
      }
    }

    const timer = setTimeout(searchContacts, 300)
    return () => clearTimeout(timer)
  }, [query, users])

  const handleSelect = (type: 'chat' | 'contact', data: any) => {
    if (onSelect) {
      onSelect({ type, data })
    }
    onOpenChange(false)
  }

  // Filter local users based on query for "Existing Chats"
  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(query.toLowerCase()) ||
    user.phone.includes(query)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] p-0 gap-0 overflow-hidden'>
        <DialogHeader className='px-4 py-3 border-b'>
          <DialogTitle>{t('chats.new_message')}</DialogTitle>

        </DialogHeader>

        <Command shouldFilter={false} className="border-0 rounded-none h-full">
          <CommandInput
            placeholder={t('chats.search_contact')}

            value={query}
            onValueChange={setQuery}
            className="h-11"
          />

          <CommandList className='max-h-[400px] overflow-y-auto p-2'>
            {!query && filteredUsers.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t('chats.write_to_search')}

              </div>
            )}

            {query && filteredUsers.length === 0 && contacts.length === 0 && !searching && (
              <CommandEmpty>{t('chats.no_results')}</CommandEmpty>

            )}

            {searching && (
              <div className="py-6 flex justify-center items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('chats.searching')}

              </div>
            )}

            {filteredUsers.length > 0 && (
              <CommandGroup heading={t('chats.existing_chats')}>

                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect('chat', user)}
                    className='flex items-center gap-3 p-2 cursor-pointer'
                  >
                    <div className="relative">
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={user.profile} alt={user.fullName} />
                        <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{user.fullName}</span>
                      <span className='text-xs text-muted-foreground'>{user.phone}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {contacts.length > 0 && (
              <>
                {filteredUsers.length > 0 && <CommandSeparator />}
                <CommandGroup heading={t('chats.contacts')}>

                  {contacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      onSelect={() => handleSelect('contact', contact)}
                      className='flex items-center gap-3 p-2 cursor-pointer'
                    >
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={contact.image} alt={contact.label} />
                        <AvatarFallback>{contact.label.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span className='font-medium'>{contact.label}</span>
                        <span className='text-xs text-muted-foreground'>{contact.description}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
