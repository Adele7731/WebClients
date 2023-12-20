import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton, ModalProps, Prompt, useApi, useNotifications } from '@proton/components';
import { reportPhishing } from '@proton/shared/lib/api/reports';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMoveToFolder } from '../../../hooks/actions/move/useMoveToFolder';
import { Element } from '../../../models/element';
import { MessageState } from '../../../store/messages/messagesTypes';

const { SPAM } = MAILBOX_LABEL_IDS;

interface Props extends ModalProps {
    message: MessageState;
    onBack: () => void;
}

const MessagePhishingModal = ({ message, onBack, ...rest }: Props) => {
    const api = useApi();
    const { moveToFolder } = useMoveToFolder();
    const { createNotification } = useNotifications();

    const { onClose } = rest;

    // Reference: Angular/src/app/bugReport/factories/bugReportModel.js
    const handleConfirmPhishing = async () => {
        onClose?.();

        await api(
            reportPhishing({
                MessageID: message.data?.ID,
                MIMEType: message.data?.MIMEType === 'text/plain' ? 'text/plain' : 'text/html', // Accept only 'text/plain' / 'text/html'
                Body: message.decryption?.decryptedBody,
            })
        );

        await moveToFolder({
            elements: [message.data || ({} as Element)],
            folderID: SPAM,
            folderName: '',
            fromLabelID: '',
            silent: true,
            askUnsub: false,
        });
        createNotification({ text: c('Success').t`Phishing reported` });
        onBack();
    };

    return (
        <Prompt
            title={c('Info').t`Confirm phishing report`}
            buttons={[
                <ErrorButton onClick={handleConfirmPhishing}>{c('Action').t`Confirm`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.`}
        </Prompt>
    );
};

export default MessagePhishingModal;
