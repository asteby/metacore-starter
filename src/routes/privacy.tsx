import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Shield, Lock, Server, FileText } from 'lucide-react'
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion"

import { useEffect, useState } from 'react'

export const Route = createFileRoute('/privacy')({
    component: PrivacyPolicy,
})

function PrivacyPolicy() {
    const [activeItem, setActiveItem] = useState("item-1")

    const lastUpdated = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Ensure page starts at top
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const handleScrollTo = (id: string, itemValue: string) => {
        setActiveItem(itemValue)
        // Wait for accordion animation to complete (approx 300ms) for accurate position
        setTimeout(() => {
            const element = document.getElementById(id)
            if (element) {
                const y = element.getBoundingClientRect().top + window.scrollY - 100
                window.scrollTo({ top: y, behavior: 'smooth' })
            }
        }, 300)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto py-12 px-4 max-w-5xl">

                {/* Header Navigation */}
                <div className="mb-10 flex items-center justify-between">
                    <Button variant="ghost" className="hover:bg-transparent pl-0 text-muted-foreground hover:text-foreground transition-colors" asChild>
                        <Link to="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la aplicación
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/favicon.svg"
                            alt="Ops Logo"
                            className="h-10 w-10 drop-shadow-sm"
                        />
                        <span className="font-bold text-2xl tracking-tight text-foreground hidden sm:block">
                            Ops
                        </span>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

                    {/* Sidebar / Table of Contents (Desktop) */}
                    <div className="hidden lg:block space-y-6">
                        <div className="sticky top-10">
                            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Contenido</h3>
                            <nav className="flex flex-col space-y-1 text-sm border-l pl-4 cursor-pointer">
                                <div onClick={() => handleScrollTo('intro', 'item-1')} className={`py-2 border-l-2 -ml-[17px] pl-4 transition-all hover:text-primary ${activeItem === 'item-1' ? 'text-foreground font-medium border-primary' : 'text-muted-foreground border-transparent'}`}>Introducción</div>
                                <div onClick={() => handleScrollTo('data-collection', 'item-2')} className={`py-2 border-l-2 -ml-[17px] pl-4 transition-all hover:text-primary ${activeItem === 'item-2' ? 'text-foreground font-medium border-primary' : 'text-muted-foreground border-transparent'}`}>Datos Recopilados</div>
                                <div onClick={() => handleScrollTo('whatsapp-usage', 'item-3')} className={`py-2 border-l-2 -ml-[17px] pl-4 transition-all hover:text-primary ${activeItem === 'item-3' ? 'text-foreground font-medium border-primary' : 'text-muted-foreground border-transparent'}`}>Uso de WhatsApp API</div>
                                <div onClick={() => handleScrollTo('data-security', 'item-4')} className={`py-2 border-l-2 -ml-[17px] pl-4 transition-all hover:text-primary ${activeItem === 'item-4' ? 'text-foreground font-medium border-primary' : 'text-muted-foreground border-transparent'}`}>Seguridad de Datos</div>
                                <div onClick={() => handleScrollTo('user-rights', 'item-5')} className={`py-2 border-l-2 -ml-[17px] pl-4 transition-all hover:text-primary ${activeItem === 'item-5' ? 'text-foreground font-medium border-primary' : 'text-muted-foreground border-transparent'}`}>Sus Derechos</div>
                            </nav>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                                Política de Privacidad
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Su privacidad es fundamental para nosotros. Esta política detalla cómo Ops gestiona, procesa y protege su información al utilizar nuestros servicios de gestión empresarial.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                                <span className="px-2 py-1 rounded bg-muted font-medium text-xs">Versión 2.1</span>
                                <span>•</span>
                                <span>Actualizado el {lastUpdated}</span>
                            </div>
                        </div>

                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-border/50">
                            <CardContent className="p-6 md:p-10">
                                <Accordion type="single" collapsible value={activeItem} onValueChange={setActiveItem} className="w-full space-y-4">

                                    <AccordionItem value="item-1" id="intro" className="border rounded-xl px-4 bg-background/50 data-[state=open]:bg-background transition-colors">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <FileText className="h-5 w-5 text-indigo-500" />
                                                <span className="text-lg font-semibold">1. Introducción y Alcance</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
                                            Bienvenido a Ops. Esta Política de Privacidad describe cómo recopilamos, utilizamos y compartimos su información personal cuando utiliza nuestro Servicio de Software como Servicio (SaaS) para la gestión empresarial integral.
                                            <br /><br />
                                            Al utilizar nuestro servicio, usted acepta la recopilación y el uso de información de acuerdo con esta política. Nos comprometemos a cumplir con el Reglamento General de Protección de Datos (RGPD), la CCPA y las políticas de la Plataforma de WhatsApp Business.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-2" id="data-collection" className="border rounded-xl px-4 bg-background/50 data-[state=open]:bg-background transition-colors">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <Server className="h-5 w-5 text-blue-500" />
                                                <span className="text-lg font-semibold">2. Datos que Recopilamos</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base space-y-4">
                                            <p>Para proporcionar nuestros servicios, podemos recopilar y procesar los siguientes datos:</p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Información de Cuenta:</strong> Nombre, correo electrónico, contraseña (encriptada) y detalles de facturación.</li>
                                                <li><strong>Datos de Conexión de WhatsApp:</strong> Identificadores de números de teléfono (Phone Number ID), Tokens de Acceso de Usuario, IDs de Cuenta de WhatsApp Business (WABA ID) y nombres de perfil.</li>
                                                <li><strong>Datos de Mensajería:</strong> Contenido de los mensajes, números de teléfono de sus clientes (destinatarios), archivos multimedia y metadatos de las interacciones (hora, estado de entrega, lectura).</li>
                                                <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de navegador, registros del sistema y datos de uso para mejorar el rendimiento y la seguridad.</li>
                                            </ul>
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg mt-4 text-sm text-amber-900 dark:text-amber-200">
                                                <strong>Nota Importante:</strong> Ops actúa como un "Proveedor de Soluciones" (Solution Provider). No somos propietarios de los datos de sus clientes finales; simplemente procesamos estos datos en su nombre para habilitar las funcionalidades de la plataforma.
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-3" id="whatsapp-usage" className="border rounded-xl px-4 bg-background/50 data-[state=open]:bg-background transition-colors">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                </div>
                                                <span className="text-lg font-semibold">3. Uso de la API de WhatsApp Business</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base space-y-4">
                                            <p>
                                                Ops utiliza integraciones con servicios de terceros para procesar y gestionar datos empresariales. Al conectar sus cuentas y servicios a nuestra plataforma, usted reconoce y acepta los siguientes términos específicos:
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Autorización:</strong> Usted nos concede permiso para enviar y recibir mensajes, multimedia y notificaciones en su nombre.</li>
                                                <li><strong>Cumplimiento:</strong> Usted es responsable de asegurar que el uso de WhatsApp cumple con la <a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de WhatsApp Business</a> y la <a href="https://www.whatsapp.com/legal/commerce-policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Comercio</a>.</li>
                                                <li><strong>Datos de Meta:</strong> Los datos procesados a través de la API de WhatsApp también están sujetos a las políticas de privacidad de Meta. No compartimos sus datos con terceros no autorizados, excepto con Meta para facilitar el servicio.</li>
                                                <li><strong>Prohibiciones:</strong> Queda estrictamente prohibido utilizar nuestra plataforma para enviar SPAM, mensajes no solicitados o contenido ilegal. Nos reservamos el derecho de suspender cuentas que violen estas normas.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-4" id="data-security" className="border rounded-xl px-4 bg-background/50 data-[state=open]:bg-background transition-colors">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <Lock className="h-5 w-5 text-red-500" />
                                                <span className="text-lg font-semibold">4. Seguridad y Retención de Datos</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
                                            Implementamos medidas de seguridad de nivel industrial para proteger sus datos, incluyendo encriptación en tránsito (SSL/TLS) y en reposo.
                                            <br /><br />
                                            <strong>Retención:</strong> Conservamos los registros de mensajes y datos de clientes solo durante el tiempo necesario para proporcionar el servicio o según lo requiera la ley. Los tokens de acceso de WhatsApp se almacenan de forma segura y encriptada.
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-5" id="user-rights" className="border rounded-xl px-4 bg-background/50 data-[state=open]:bg-background transition-colors">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <Shield className="h-5 w-5 text-teal-500" />
                                                <span className="text-lg font-semibold">5. Sus Derechos y Eliminación de Datos</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
                                            Usted tiene control total sobre sus datos. Puede ejercer los siguientes derechos en cualquier momento:
                                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                                <li><strong>Acceso y Portabilidad:</strong> Solicitar una copia de los datos que almacenamos sobre su cuenta.</li>
                                                <li><strong>Desconexión:</strong> Puede revocar el acceso de nuestra aplicación a su cuenta de WhatsApp en cualquier momento desde la configuración de su cuenta de Facebook Business o eliminando el dispositivo en nuestra plataforma.</li>
                                                <li><strong>Eliminación (Derecho al Olvido):</strong> Tras la desconexión o cancelación de la cuenta, eliminaremos sus credenciales y datos de mensajes de nuestros servidores, salvo aquellos que estemos legalmente obligados a conservar.</li>
                                            </ul>
                                            <br />
                                            Para ejercer estos derechos, contáctenos a través de nuestro soporte o envíe un correo a privacy@ops.asteby.com.
                                        </AccordionContent>
                                    </AccordionItem>

                                </Accordion>

                                <div className="mt-12 pt-8 border-t text-center">
                                    <p className="text-muted-foreground mb-4">
                                        ¿Tiene dudas sobre nuestra política de privacidad? <a href="mailto:privacy@ops.asteby.com" className="text-primary hover:underline font-medium">Contáctenos</a>
                                    </p>
                                    <p className="text-sm text-muted-foreground/60">
                                        &copy; {new Date().getFullYear()} Ops. Todos los derechos reservados.
                                    </p>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
